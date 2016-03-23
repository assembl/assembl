import logging
import six

import transaction
from sqlalchemy import (
    Boolean,
    Column,
    String,
    ForeignKey,
    Integer,
    UnicodeText,
    DateTime,
    Time,
    Binary,
    Text,
    inspect,
    desc,
    event,
    Index,
    UniqueConstraint
)
import simplejson as json
from sqlalchemy.orm import (
    relationship, backref, deferred)
from social.storage.sqlalchemy_orm import (
    SQLAlchemyMixin, SQLAlchemyUserMixin, SQLAlchemyNonceMixin, UserMixin,
    SQLAlchemyAssociationMixin, SQLAlchemyCodeMixin, BaseSQLAlchemyStorage)
from sqlalchemy.ext.mutable import MutableDict

from ..lib import config
from ..lib.sqla_types import (
    URLString, EmailString, EmailUnicode, CaseInsensitiveWord, JSONType)
from .auth import (
    AbstractAgentAccount, IdentityProvider, AgentProfile, User, Username)
from . import Base
from ..semantic.namespaces import (
    SIOC, ASSEMBL, QUADNAMES, FOAF, DCTERMS, RDF)
from ..semantic.virtuoso_mapping import (
    QuadMapPatternS, USER_SECTION, PRIVATE_USER_SECTION,
    AssemblQuadStorageManager)


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
    """An account with an external identity provider"""
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
        nullable=False,
        info={'rdf': QuadMapPatternS(None, SIOC.member_of)})
    identity_provider = relationship(IdentityProvider)
    username = Column(String(200))
    #    info={'rdf': QuadMapPatternS(None, SIOC.name)})
    provider_domain = Column(String(255))
    uid = Column(String(UID_LENGTH), nullable=False)
    #    info={'rdf': QuadMapPatternS(None, SIOC.id)})
    extra_data = Column(MutableDict.as_mutable(JSONType))
    picture_url = Column(URLString)
    user = relationship(AgentProfile, backref='socialauth_accounts')

    @property
    def provider(self):
        return self.identity_provider.name

    @provider.setter
    def provider(self, value):
        self.identity_provider = IdentityProvider.get_by_name(value)

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
            qs = cls._query().join(cls.identity_provider).filter(IdentityProvider.name != backend_name)
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
        return cls.default_db().query(User).join(
            User.accounts).filter(
                cls.email == email, cls.verified == True
            ).all()

    @classmethod
    def get_social_auth(cls, provider, uid, provider_domain=None):
        if not isinstance(uid, six.string_types):
            uid = str(uid)
        return cls._query().join(
            cls.identity_provider).filter(
                IdentityProvider.name == provider, cls.uid == uid,
                cls.provider_domain == provider_domain).first()

    @classmethod
    def get_social_auth_for_user(
            cls, user, provider=None, id=None, provider_domain=None):
        qs = cls._query().filter_by(profile_id=user.id)
        if provider:
            qs = qs.join(
                cls.identity_provider).filter(
                    IdentityProvider.name == provider,
                    cls.provider_domain == provider_domain)
        if id:
            qs = qs.filter(cls.id == id)
        return qs

    @classmethod
    def create_social_auth(cls, user, uid, provider, provider_domain=None):
        if not isinstance(uid, six.string_types):
            uid = str(uid)
        return cls._new_instance(
            cls, profile=user, uid=uid, provider_domain=provider_domain,
            identity_provider=IdentityProvider.get_by_name(provider))

    # Lifted from IdentityProviderAccount

    def signature(self):
        return ('idprovider_agent_account', self.provider_id, self.username,
                self.domain, self.uid)

    def interpret_profile(self, profile=None):
        profile = profile or self.extra_data
        if not profile:
            return
        self.populate_picture(profile)
        self.username = profile.get('user_login', self.username)
        email = profile.get('email', self.email)
        if email and email != self.email_ci:
            self.email = email
            self.verified = self.identity_provider.trust_emails
        if not self.email:
            for email in profile.get('emails', ()):
                self.verified = False
                self.email = email.get('value', None)
                if email.get('primary', False):
                    break

    def display_name(self):
        # TODO: format according to provider, ie @ for twitter.
        if self.username:
            name = self.username
        else:
            name = self.uid
        return ":".join((self.identity_provider.provider_type, name))

    def get_provider_name(self):
        return self.identity_provider.name

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
        elif self.identity_provider.provider_type.startswith('facebook'):
            accounts = [x.get('uid') for x in profile.get('accounts', ())]
            accounts = [x for x in accounts if x]
            if accounts:
                self.picture_url = 'http://graph.facebook.com/%s/picture' % (
                    accounts[0])

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
        if self.identity_provider.provider_type.startswith('google'):
            return '%s?size=%d' % (picture_url, size)
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

    # @classmethod
    # def special_quad_patterns(cls, alias_maker, discussion_id):
    #     return [QuadMapPatternS(AgentProfile.iri_class().apply(
    #             SocialAuthAccount.profile_id),
    #         FOAF.img, SocialAuthAccount.picture_url,
    #         name=QUADNAMES.foaf_image,
    #         conditions=(SocialAuthAccount.picture_url != None),
    #         sections=(PRIVATE_USER_SECTION,))]

    def unique_query(self):
        query, _ = super(SocialAuthAccount, self).unique_query()
        return query.filter_by(
            type=self.type, provider_id=self.provider_id,
            username=self.username), True

    @classmethod
    def find_accounts(cls, provider, velruse_account):
        # Probably deprecated
        if 'email' in velruse_account:
            return provider.db.query(cls).filter_by(
                provider=provider,
                domain=velruse_account['domain'],
                email=velruse_account['email']).all()
        elif 'username' in velruse_account:
            return provider.db.query(cls).filter_by(
                provider=provider,
                domain=velruse_account['domain'],
                uid=velruse_account['username']).all()
        else:
            log.error("account needs username or email" +
                      velruse_account)
            raise RuntimeError("account needs username or uid")

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
