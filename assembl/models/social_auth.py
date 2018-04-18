"""Models for integration of `Python Social Auth`_.

.. _`Python Social Auth`: http://psa.matiasaguirre.net/
"""
import logging
import six
import re
from datetime import datetime, timedelta

import transaction
from sqlalchemy import (
    Column,
    String,
    ForeignKey,
    Integer,
    Unicode,
    DateTime,
    UniqueConstraint
)
from sqlalchemy.orm import relationship
from social_core.exceptions import MissingBackend
from social_sqlalchemy.storage import (
    SQLAlchemyMixin, SQLAlchemyNonceMixin, UserMixin,
    SQLAlchemyAssociationMixin, SQLAlchemyCodeMixin, BaseSQLAlchemyStorage)
from sqlalchemy.ext.mutable import MutableDict
from urllib import unquote

from ..lib import config
from ..lib.sqla_types import URLString, JSONType
from .auth import AbstractAgentAccount, IdentityProvider, AgentProfile, User, Username
from ..auth.generic_auth_backend import GenericAuth
from . import Base


log = logging.getLogger('assembl')


class AssemblSocialAuthMixin(Base, SQLAlchemyMixin):
    __abstract__ = True

    @classmethod
    def _session(cls):
        return cls.default_db()

    @classmethod
    def _query(cls):
        return cls._session().query(cls)

    @classmethod
    def _new_instance(cls, model, *args, **kwargs):
        session = kwargs.pop('session', cls.default_db())
        instance = model(*args, **kwargs)
        session.add(instance)
        session.flush()
        return instance

    @classmethod
    def _save_instance(cls, instance):
        instance.session().add(instance)
        instance.session().flush()
        return instance

    @classmethod
    def _flush(cls):
        try:
            cls._session().flush()
        except AssertionError:
            with transaction.manager as manager:
                manager.commit()

    def save(self):
        self.session.add(self)
        self.session.flush()


class Nonce(AssemblSocialAuthMixin, SQLAlchemyNonceMixin):
    pass


class Association(AssemblSocialAuthMixin, SQLAlchemyAssociationMixin):
    pass


class Code(AssemblSocialAuthMixin, SQLAlchemyCodeMixin):
    pass


class SocialAuthAccount(
        AbstractAgentAccount, AssemblSocialAuthMixin, UserMixin):
    """An account with an external :py:class:`.auth.IdentityProvider`"""
    __tablename__ = "social_auth_account"
    __mapper_args__ = {
        'polymorphic_identity': 'social_auth_account',
    }
    __table_args__ = (
        UniqueConstraint('provider_id', 'provider_domain', 'uid'), )
    UID_LENGTH = config.get('UID_LENGTH', 255)

    id = Column(Integer, ForeignKey(
        'abstract_agent_account.id',
        ondelete='CASCADE', onupdate='CASCADE'
    ), primary_key=True)
    provider_id = Column(
        Integer,
        ForeignKey('identity_provider.id',
                   ondelete='CASCADE', onupdate='CASCADE'),
        nullable=False)
    identity_provider = relationship(IdentityProvider)
    username = Column(Unicode(200))
    provider_domain = Column(String(255))
    uid = Column(String(UID_LENGTH), nullable=False)
    extra_data = Column(MutableDict.as_mutable(JSONType))
    picture_url = Column(URLString)
    user = relationship(AgentProfile, backref='identity_accounts')
    last_checked = Column(DateTime)

    def successful_login(self):
        self.last_checked = datetime.utcnow()

    def login_expiry(self):
        if self.last_checked is None:
            return datetime.utcnow() - timedelta(seconds=1)
        expiry = self.login_duration()
        if not expiry:
            return None
        return self.last_checked + timedelta(expiry)

    @property
    def provider(self):
        return self.identity_provider.provider_type

    @property
    def provider_with_idp(self):
        provider = self.provider
        if provider == 'saml':
            # PSA prefixes SAML uids with the idp_name
            idp_name = self.uid.split(':')[0]
            # Also available as self.extra_data['idp_name']
            return ':'.join((provider, idp_name))
        return provider

    @provider.setter
    def provider(self, value):
        self.identity_provider = IdentityProvider.get_by_type(value)

    def __init__(self, **kwargs):
        super(SocialAuthAccount, self).__init__(**kwargs)
        self.interpret_profile(self.extra_data)

    # reimplementation of UserSocialAuth
    @classmethod
    def username_max_length(cls):
        return Username.__table__.columns.get('username').type.length

    @classmethod
    def user_model(cls):
        return User

    # reimplementation of SQLAlchemyUserMixin

    @classmethod
    def changed(cls, user):
        cls._save_instance(user)

    def set_extra_data(self, extra_data=None):
        if super(SocialAuthAccount, self).set_extra_data(extra_data):
            self.interpret_profile(self.extra_data)

    @classmethod
    def allowed_to_disconnect(cls, user, backend_name, association_id=None):
        if association_id is not None:
            qs = cls._query().filter(cls.id != association_id)
        else:
            qs = cls._query().join(cls.identity_provider).filter(IdentityProvider.provider_type != backend_name)
        qs = qs.filter(cls.user == user)

        if hasattr(user, 'has_usable_password'):  # TODO
            valid_password = user.has_usable_password()
        else:
            valid_password = True
        return valid_password or qs.count() > 0

    @classmethod
    def disconnect(cls, entry):
        cls._session().delete(entry)
        cls._flush()

    @classmethod
    def user_query(cls):
        return cls._session().query(cls.user_model())

    @classmethod
    def user_exists(cls, *args, **kwargs):
        """
        Return True/False if a User instance exists with the given arguments.
        Arguments are directly passed to filter() manager method.
        """
        query = cls.user_query()
        username = kwargs.pop('username', None)
        if username:
            query = query.join(
                User.username).filter(Username.username == username)
        return query.filter_by(*args, **kwargs).count() > 0

    @classmethod
    def get_username(cls, user):
        """Return the username for given user"""
        # assume user is a User, not an AgentProfile
        return user.username_p

    @classmethod
    def create_user(cls, email=None, username=None, fullname=None, *args, **kwargs):
        if fullname:
            kwargs['name'] = fullname
        user = cls._new_instance(cls.user_model(), *args, **kwargs)
        if username:
            user.db.add(Username(user=user, username=username))
        return user

    @classmethod
    def get_user(cls, pk):
        return cls.user_query().get(pk)

    @classmethod
    def get_users_by_email(cls, email):
        # Find users with similar email.
        # Only use if social provider is trusted to have verified email.
        users = cls.default_db().query(User).join(
            User.accounts).filter(
                AbstractAgentAccount.email_ci == email,
            ).all()
        # choose best known profile for base_account
        # prefer profiles with verified users, then users, then oldest profiles
        users.sort(key=lambda p: (
            isinstance(p, User) and p.verified,
            isinstance(p, User), -p.id),
            reverse=True)
        return users

    @classmethod
    def get_social_auth(cls, provider, uid):
        if not isinstance(uid, six.string_types):
            uid = str(uid)
        return cls._query().join(
            cls.identity_provider).filter(
                IdentityProvider.provider_type == provider, cls.uid == uid).first()

    @classmethod
    def get_social_auth_for_user(
            cls, user, provider=None, id=None):
        qs = cls._query().filter_by(profile_id=user.id)
        if provider:
            qs = qs.join(
                cls.identity_provider).filter(
                    IdentityProvider.provider_type == provider)
        if id:
            qs = qs.filter(cls.id == id)
        return qs

    @classmethod
    def create_social_auth(cls, user, uid, provider):
        if not isinstance(uid, six.string_types):
            uid = str(uid)
        id_provider = IdentityProvider.get_by_type(provider)
        return cls._new_instance(
            cls, profile=user, uid=uid,
            identity_provider=id_provider, verified=id_provider.trust_emails)

    # override social_core.storage.UserMixin.get_backend_instance
    def get_backend_instance(self, strategy):
        try:
            backend_class = self.get_backend(strategy)
        except MissingBackend:
            return None
        else:
            if issubclass(backend_class, GenericAuth):
                return backend_class(strategy=strategy, name=self.provider)
            else:
                return backend_class(strategy=strategy)

    # Lifted from IdentityProviderAccount

    def signature(self):
        return ('idprovider_agent_account',
                self.provider_id, self.username, self.uid)

    def interpret_profile(self, profile=None):
        profile = profile or self.extra_data
        if profile:
            self.populate_picture(profile)
            if not self.email:
                # May be missed by social auth. compensate.
                emails = profile.get('emails', [])
                if emails:
                    self.email = emails[0].get('value', '')

    def interpret_social_auth_details(self, details):
        self.email = details.get("email", self.email)
        self.username = details.get('username', self.username)
        # TODO: Maybe see if username usable for user?
        fullname = details.get("fullname")
        if not fullname:
            first_name = details.get('first_name', None)
            last_name = details.get('last_name', None)
            if first_name and last_name:
                fullname = ' '.join((first_name, last_name))
        if fullname and not self.user.name:
            self.user.name = fullname

    def display_name(self):
        # TODO: format according to provider, ie @ for twitter.
        if self.username:
            name = self.username
        else:
            name = self.uid
        return ":".join((self.identity_provider.provider_type, name))

    def get_provider_name(self):
        return self.identity_provider.name

    def get_provider_type(self):
        return self.identity_provider.provider_type

    def real_name(self):
        if not self.full_name:
            info = self.extra_data
            name = info.get('name', {})
            if name.get('formatted', None):
                self.full_name = name['formatted']
            elif 'givenName' in name and 'familyName' in name:
                self.full_name = ' '.join(
                    (name['givenName'], name['familyName']))
        return self.full_name

    def populate_picture(self, profile):
        if 'photos' in profile:  # google, facebook
            photos = [x.get('value', None) for x in profile['photos']]
            photos = [x for x in photos if x]
            if photos:
                self.picture_url = photos[0]
        elif 'image' in profile:  # google
            photo = profile['image'].get('url', None)
            if photo:
                self.picture_url = photo
        elif profile.get('user', {}).get('mugshot_url_template', None):  # yammer
            self.picture_url = profile['user']['mugshot_url_template']
        elif profile.get('user', {}).get('mugshot_url', None):  # yammer
            self.picture_url = profile['user']['mugshot_url']
        elif profile.get('mugshot_url', None):  # yammer
            self.picture_url = profile['mugshot_url']
        elif self.identity_provider.provider_type.startswith('facebook'):
            account = profile.get('id', None)
            if account is None:
                accounts = [x.get('uid') for x in profile.get('accounts', ())]
                accounts = [x for x in accounts if x]
                if not accounts:
                    return
                account = accounts[0]
            self.picture_url = 'http://graph.facebook.com/%s/picture' % (account)

    facebook_sizes = (
        ('square', 50), ('small', 50), ('normal', 100), ('large', 200))
    twitter_sizes = (
        ('_mini', 25), ('_normal', 48), ('_bigger', 73), ('', 1000))

    def avatar_url(self, size=32):
        picture_url = self.picture_url
        if not picture_url:
            return
        if config.get("accept_secure_connection"):
            # Make the connection https, known services can handle both.
            # Ideally we should check which ones work.
            picture_url = "https://" + picture_url.split("://", 1)[-1]
        if "{width}" in unquote(picture_url):  # yammer
            picture_url = unquote(picture_url).format(width=size, height=size)
            return picture_url
        if self.identity_provider.provider_type.startswith('google'):
            modified = re.sub(
                r"((\?|&)(size|sz))=(\d+)",
                r"\1=%d" % (size,), picture_url)
            if modified == picture_url:
                separator = "&" if "?" in picture_url else "?"
                modified = picture_url + separator + 'sz=' + str(size)
            return modified
        elif self.identity_provider.provider_type.startswith('facebook'):
            for (size_name, name_size) in self.facebook_sizes:
                if size <= name_size:
                    break
            return '%s?type=%s' % (picture_url, size_name)
        elif self.identity_provider.provider_type == 'twitter':
            for (size_name, name_size) in self.twitter_sizes:
                if size <= name_size:
                    break
            return size_name.join(picture_url.split('_normal'))

    def unique_query(self):
        query, _ = super(SocialAuthAccount, self).unique_query()
        return query.filter_by(
            type=self.type, provider_id=self.provider_id,
            username=self.username), True

    @classmethod
    def find_accounts(cls, provider, social_account):
        # Probably deprecated
        if 'email' in social_account:
            return provider.db.query(cls).filter_by(
                provider=provider,
                domain=social_account['domain'],
                email_ci=social_account['email']).all()
        elif 'username' in social_account:
            return provider.db.query(cls).filter_by(
                provider=provider,
                domain=social_account['domain'],
                uid=social_account['username']).all()
        else:
            log.error("account needs username or email" +
                      social_account)
            raise RuntimeError("account needs username or uid")

    def login_duration(self):
        data = self.extra_data
        intrinsic = None
        if 'expires' in data:
            intrinsic = data['expires']
        elif 'expires_in' in data:
            intrinsic = data['expires_in']
        provider = self.provider_with_idp
        provider = '_'.join(provider.split(':'))
        config_t = config.get('login_expiry_' + provider, None)
        if config_t is None and '_' in provider:
            config_t = config.get(
                'login_expiry_' + provider.split('_')[0], None)
        if config_t is None:
            config_t = config.get('login_expiry_default', None)
        if intrinsic is not None:
            # convert to days
            intrinsic = float(intrinsic) / 864000
            if config_t is not None:
                # take minimum of intrinsic or config.
                intrinsic = min(float(config_t), intrinsic)
        return float(intrinsic or config_t or 0)

    # temporary shims
    @property
    def profile_info_json(self):
        return self.extra_data

    @profile_info_json.setter
    def profile_info_json(self, val):
        self.extra_data = val
        self.interpret_profile(val)


class AssemblStorage(BaseSQLAlchemyStorage):
    user = SocialAuthAccount
    nonce = Nonce
    association = Association
    code = Code
