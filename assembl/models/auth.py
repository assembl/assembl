from datetime import datetime
from itertools import chain
import urllib
import hashlib
import chroma
import simplejson as json

from sqlalchemy import (
    Boolean,
    Column,
    String,
    ForeignKey,
    Integer,
    Unicode,
    UnicodeText,
    DateTime,
    Time,
    Binary,
    desc,
    Index
)

from sqlalchemy.orm import relationship, backref, deferred
from sqlalchemy import inspect
from sqlalchemy.types import Text
from sqlalchemy.orm.attributes import NO_VALUE
from pyramid.security import Everyone, Authenticated
from virtuoso.vmapping import IriClass

from ..lib import config
from ..lib.sqla import (UPDATE_OP, INSERT_OP, get_model_watcher)
from . import Base, DiscussionBoundBase, DiscussionBoundTombstone
from ..auth import *
from ..semantic.namespaces import (
    SIOC, ASSEMBL, CATALYST, QUADNAMES, VERSION, FOAF, DCTERMS, RDF, VirtRDF)
from ..semantic.virtuoso_mapping import QuadMapPatternS, USER_SECTION


class AgentProfile(Base):
    """
    An agent could be a person, group, bot or computer.
    Profiles describe agents, which have multiple accounts.
    Some agents might also be users of the platforms.
    """
    __tablename__ = "agent_profile"
    rdf_class = FOAF.Agent
    rdf_section = USER_SECTION

    id = Column(Integer, primary_key=True,
        info={'rdf': QuadMapPatternS(None, ASSEMBL.db_id)})
    name = Column(Unicode(1024),
        info={'rdf': QuadMapPatternS(None, FOAF.name)})
    description = Column(UnicodeText,
        info= {'rdf': QuadMapPatternS(None, DCTERMS.description)})
    type = Column(String(60))

    __mapper_args__ = {
        'polymorphic_identity': 'agent_profile',
        'polymorphic_on': type,
        'with_polymorphic': '*'
    }

    def get_preferred_email(self):
        if inspect(self).attrs.email_accounts.loaded_value is NO_VALUE:
            email = self.db.query(EmailAccount.email).filter_by(
                profile_id=self.id).order_by(
                EmailAccount.verified.desc(),
                EmailAccount.preferred.desc()).first()
            if email:
                return email[0]
        elif self.email_accounts:
            accounts = self.email_accounts[:]
            accounts.sort(key=lambda e: (not e.verified, not e.preferred))
            return accounts[0].email

    def real_name(self):
        if not self.name:
            for acc in self.identity_accounts:
                name = acc.real_name()
                if name:
                    self.name = name
                    break
        return self.name

    def display_name(self):
        # TODO: Prefer types?
        if self.name:
            return self.name
        for acc in self.identity_accounts:
            if acc.username:
                return acc.display_name()
        for acc in self.accounts:
            name = acc.display_name()
            if name:
                return name

    def merge(self, other_profile):
        session = self.db
        assert not (
            isinstance(other_profile, User) and not isinstance(self, User))
        my_accounts = {a.signature(): a for a in self.accounts}
        for other_account in other_profile.accounts:
            my_account = my_accounts.get(other_account.signature())
            if my_account:
                my_account.merge(other_account)
                session.delete(other_account)
            else:
                other_account.profile = self
        if other_profile.name and not self.name:
            self.name = other_profile.name
        # TODO: similarly for posts
        from .action import Action
        for action in session.query(Action).filter_by(
            actor_id=other_profile.id).all():
                action.actor = self

    def has_permission(self, verb, subject):
        if self is subject.owner:
            return True

        return self.db.query(Permission).filter_by(
            actor_id=self.id,
            subject_id=subject.id,
            verb=verb,
            allow=True
        ).one()

    def avatar_url(self, size=32, app_url=None, email=None):
        default = config.get('avatar.default_image_url') or \
            (app_url and app_url+'/static/img/icon/user.png')
        
        offline_mode = config.get('offline_mode')
        if offline_mode == "true":
            return default
        

        for acc in self.identity_accounts:
            url = acc.avatar_url(size)
            if url:
                return url
        # Otherwise: Use the gravatar URL
        email = email or self.get_preferred_email()
        if not email:
            return default
        default = config.get('avatar.gravatar_default') or default
        return EmailAccount.avatar_url_for(email, size, default)

    def external_avatar_url(self):
        return "/user/id/%d/avatar/" % (self.id,)

    def serializable(self, use_email=None):
        return {
            '@type': self.external_typename(),
            '@id': self.uri_generic(self.id),
            'name': self.name or self.display_name()
        }
    def get_agent_preload(self, view_def=None):
        if view_def:
            result = self.generic_json(view_def)
        else:
            result = self.serializable()
        return json.dumps(result)


class AbstractAgentAccount(Base):
    """An abstract class for accounts that identify agents"""
    __tablename__ = "abstract_agent_account"
    rdf_class = SIOC.UserAccount
    rdf_section = USER_SECTION

    id = Column(Integer, primary_key=True,
        info={'rdf': QuadMapPatternS(None, ASSEMBL.db_id)})
    type = Column(String(60))
    profile_id = Column(
        Integer,
        ForeignKey('agent_profile.id', ondelete='CASCADE', onupdate='CASCADE'),
        nullable=False,
        info={'rdf': QuadMapPatternS(None, SIOC.account_of)})
    profile = relationship('AgentProfile',
        backref=backref('accounts', cascade="all, delete-orphan"))

    def signature(self):
        "Identity of signature implies identity of underlying account"
        return ('abstract_agent_account', self.id)
    def merge(self, other):
        pass
    __mapper_args__ = {
        'polymorphic_identity': 'abstract_agent_account',
        'polymorphic_on': type,
        'with_polymorphic': '*'
    }


class EmailAccount(AbstractAgentAccount):
    """An email account"""
    __tablename__ = "agent_email_account"
    __mapper_args__ = {
        'polymorphic_identity': 'agent_email_account',
    }
    id = Column(Integer, ForeignKey(
        'abstract_agent_account.id',
        ondelete='CASCADE', onupdate='CASCADE'
    ), primary_key=True)
    email = Column(String(100), nullable=False, index=True,
        info={'rdf': QuadMapPatternS(None, SIOC.email)})
    verified = Column(Boolean(), default=False)
    preferred = Column(Boolean(), default=False)
    active = Column(Boolean(), default=True)
    profile_e = relationship(AgentProfile, backref=backref('email_accounts'))

    def display_name(self):
        if self.verified:
            return self.email

    def serialize_profile(self):
        return self.profile.serializable(self.email)

    def signature(self):
        return ('agent_email_account', self.email,)

    def merge(self, other):
        if other.verified:
            self.verified = True

    def other_account(self):
        if not self.verified:
            return self.db.query(self.__class__).filter_by(
                email=self.email, verified=True).first()

    def avatar_url(self, size=32, default=None):
        return self.avatar_url_for(self.email, size, default)

    @staticmethod
    def avatar_url_for(email, size=32, default=None):
        args = {'s': str(size)}
        if default:
            args['d'] = default
        return "http://www.gravatar.com/avatar/%s?%s" % (
            hashlib.md5(email.lower()).hexdigest(), urllib.urlencode(args))

    @staticmethod
    def get_or_make_profile(session, email, name=None):
        emails = list(session.query(EmailAccount).filter_by(
            email=email).all())
        # We do not want unverified user emails
        # This is costly. I should have proper boolean markers
        emails = [e for e in emails if e.verified or not isinstance(e.profile, User)]
        user_emails = [e for e in emails if isinstance(e.profile, User)]
        if user_emails:
            assert len(user_emails) == 1
            return user_emails[0]
        elif emails:
            # should also be 1 but less confident.
            return emails[0]
        else:
            profile = AgentProfile(name=name)
            emailAccount = EmailAccount(email=email, profile=profile)
            session.add(emailAccount)
            return emailAccount


class IdentityProvider(Base):
    """An identity provider (or sometimes a category of identity providers.)"""
    __tablename__ = "identity_provider"
    rdf_class = SIOC.Usergroup
    rdf_section = USER_SECTION

    id = Column(Integer, primary_key=True)
    provider_type = Column(String(20), nullable=False)
    name = Column(String(60), nullable=False,
        info={'rdf': QuadMapPatternS(None, SIOC.name)})
    # TODO: More complicated model, where trust also depends on realm.
    trust_emails = Column(Boolean, default=False)


class IdentityProviderAccount(AbstractAgentAccount):
    """An account with an external identity provider"""
    __tablename__ = "idprovider_agent_account"
    __mapper_args__ = {
        'polymorphic_identity': 'idprovider_agent_account',
    }
    id = Column(Integer, ForeignKey(
        'abstract_agent_account.id',
        ondelete='CASCADE', onupdate='CASCADE'
    ), primary_key=True)
    provider_id = Column(
        Integer,
        ForeignKey('identity_provider.id', ondelete='CASCADE', onupdate='CASCADE'),
        nullable=False,
        info={'rdf': QuadMapPatternS(None, SIOC.member_of)})
    provider = relationship(IdentityProvider)
    username = Column(String(200),
        info={'rdf': QuadMapPatternS(None, SIOC.name)})
    domain = Column(String(200))
    userid = Column(String(200),
        info={'rdf': QuadMapPatternS(None, SIOC.id)})
    profile_info = deferred(Column(Text()))
    picture_url = Column(String(300),
        info={'rdf': QuadMapPatternS(None, FOAF.img)})
    profile_i = relationship(AgentProfile, backref='identity_accounts')

    def signature(self):
        return ('idprovider_agent_account', self.provider_id, self.username,
                self.domain, self.userid)

    def display_name(self):
        # TODO: format according to provider, ie @ for twitter.
        if self.username:
            name = self.username
        else:
            name = self.userid
        return ":".join((self.provider.provider_type, name))

    def real_name(self):
        info = self.profile_info_json
        name = info['name']
        if name.get('formatted', None):
            return name['formatted']
        if 'givenName' in name and 'familyName' in name:
            return ' '.join((name['givenName'], name['familyName']))

    def populate_picture(self, profile=None):
        if self.picture_url:
            return
        profile = profile or self.profile_info_json
        if not profile:
            return
        if 'photos' in profile:  # google, facebook
            photos = [x.get('value', None) for x in profile['photos']]
            photos = [x for x in photos if x]
            if photos:
                self.picture_url = photos[0]
        elif self.provider.provider_type == 'facebook':
            accounts = [x.get('userid') for x in profile.get('accounts', ())]
            accounts = [x for x in accounts if x]
            if accounts:
                self.picture_url = 'http://graph.facebook.com/%s/picture' % (
                    accounts[0])

    facebook_sizes = (('square', 50), ('small', 50), ('normal', 100), ('large', 200))
    twitter_sizes = (('_mini', 25), ('_normal', 48), ('_bigger', 73), ('', 1000))

    def avatar_url(self, size=32):
        if not self.picture_url:
            self.populate_picture()
        if not self.picture_url:
            return
        if self.provider.provider_type == 'google_oauth2':
            return '%s?size=%d' % (self.picture_url, size)
        elif self.provider.provider_type == 'facebook':
            for (size_name, name_size) in self.facebook_sizes:
                if size <= name_size:
                    break
            return '%s?type=%s' % (self.picture_url, size_name)
        elif self.provider.provider_type == 'twitter':
            for (size_name, name_size) in self.twitter_sizes:
                if size <= name_size:
                    break
            return size_name.join(self.picture_url.split('_normal'))

    @property
    def profile_info_json(self):
        if self.profile_info:
            return json.loads(self.profile_info)
        return {}

    @profile_info_json.setter
    def profile_info_json(self, val):
        self.profile_info = json.dumps(val)


class User(AgentProfile):
    """
    A Human user.
    """
    __tablename__ = "user"

    __mapper_args__ = {
        'polymorphic_identity': 'user'
    }

    id = Column(
        Integer,
        ForeignKey('agent_profile.id', ondelete='CASCADE', onupdate='CASCADE'),
        primary_key=True
    )

    preferred_email = Column(Unicode(50),
        info={'rdf': QuadMapPatternS(None, FOAF.mbox)})
    verified = Column(Boolean(), default=False)
    password = deferred(Column(Binary(115)))
    timezone = Column(Time(True))
    last_login = Column(DateTime)
    login_failures = Column(Integer, default=0)
    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow,
        info={'rdf': QuadMapPatternS(None, DCTERMS.created)})

    def __init__(self, **kwargs):
        if kwargs.get('password'):
            from ..auth.password import hash_password
            kwargs['password'] = hash_password(kwargs['password'])

        super(User, self).__init__(**kwargs)

    def set_password(self, password):
        from ..auth.password import hash_password
        self.password = hash_password(password)

    def check_password(self, password):
        if self.password:
            from ..auth.password import verify_password
            return verify_password(password, self.password)
        return False

    def get_preferred_email(self):
        if self.preferred_email:
            return self.preferred_email
        return super(User, self).get_preferred_email()

    def merge(self, other_user):
        super(User, self).merge(other_user)
        if isinstance(other_user, User):
            session = self.db
            if other_user.preferred_email and not self.preferred_email:
                self.preferred_email = other_user.preferred_email
            if other_user.last_login:
                if self.last_login:
                    self.last_login = max(
                        self.last_login, other_user.last_login)
                else:
                    self.last_login = other_user.last_login
            self.creation_date = min(
                self.creation_date, other_user.creation_date)
            if other_user.password and not self.password:
                self.password = other_user.password
                # NOTE: The user may be confused by the implicit change of password
                # when we destroy the second account.
                # Maybe check latest login on either account?
            for extract in other_user.extracts_created:
                extract.creator = self
            for extract in other_user.extracts_owned:
                extract.owner = self
            for post in other_user.posts_created:
                post.creator = self
            for role in other_user.roles:
                role.user = self
            for role in other_user.local_roles:
                role.user = self
            if other_user.username and not self.username:
                self.username = other_user.username

    def send_email(self, **kwargs):
        subject = kwargs.get('subject', '')
        body = kwargs.get('body', '')

        # Send email.

    def avatar_url(self, size=32, app_url=None, email=None):
        return super(User, self).avatar_url(
            size, app_url, email or self.preferred_email)

    def display_name(self):
        if self.username:
            return self.username.username
        return super(User, self).display_name()

    def __repr__(self):
        if self.username:
            return "<User '%s'>" % self.username.username
        else:
            return "<User id=%d>" % self.id

    def get_permissions(self, discussion_id):
        from ..auth.util import get_permissions
        return get_permissions(self.id, discussion_id)

    def get_all_permissions(self):
        from ..auth.util import get_permissions
        from .discussion import Discussion
        permissions = {
            Discussion.uri_generic(d_id): get_permissions(self.id, d_id)
            for (d_id,) in self.db.query(Discussion.id)}
        return permissions

    def send_to_changes(self, connection=None, operation=UPDATE_OP):
        super(User, self).send_to_changes(connection, operation)
        watcher = get_model_watcher()
        if operation == UPDATE_OP:
            watcher.processAccountModified(self.id)
        elif operation == INSERT_OP:
            watcher.processAccountCreated(self.id)

    def serializable(self, use_email=None):
        ser = super(User, self).serializable()
        ser['username'] = self.display_name()
        #r['email'] = use_email or self.get_preferred_email()
        return ser


class Username(Base):
    "Optional usernames for users"
    __tablename__ = 'username'
    user_id = Column(Integer,
                     ForeignKey('user.id', ondelete='CASCADE', onupdate='CASCADE'),
                     unique=True)
    username = Column(Unicode(20), primary_key=True)
    user = relationship(User, backref=backref('username', uselist=False))

    def get_id_as_str(self):
        return str(self.user_id)

    @classmethod
    def special_quad_patterns(cls, alias_manager):
        return [QuadMapPatternS(User.iri_class().apply(Username.user_id),
            SIOC.name, Username.username,
            name=QUADNAMES.class_User_username, section=USER_SECTION)]


class Role(Base):
    """A role that a user may have in a discussion"""
    __tablename__ = 'role'
    rdf_class = SIOC.Role
    rdf_section = USER_SECTION

    id = Column(Integer, primary_key=True,
        info={'rdf': QuadMapPatternS(None, ASSEMBL.db_id)})
    name = Column(String(20), nullable=False,
        info={'rdf': QuadMapPatternS(None, SIOC.name)})

    @classmethod
    def get_role(cls, session, name):
        return session.query(cls).filter_by(name=name).first()


def populate_default_roles(session):
    roles = {r[0] for r in session.query(Role.name).all()}
    for role in SYSTEM_ROLES - roles:
        session.add(Role(name=role))


class UserRole(Base):
    """roles that a user has globally (eg admin.)"""
    __tablename__ = 'user_role'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id', ondelete='CASCADE', onupdate='CASCADE'),
                     index=True)
    user = relationship(User, backref="roles")
    role_id = Column(Integer, ForeignKey('role.id', ondelete='CASCADE', onupdate='CASCADE'))
    role = relationship(Role, lazy="joined")

    @classmethod
    def special_quad_patterns(cls, alias_manager):
        return [
        QuadMapPatternS(User.iri_class().apply(UserRole.user_id),
            SIOC.has_function, Role.iri_class().apply(UserRole.role_id),
            name=QUADNAMES.class_UserRole_global, section=USER_SECTION),
        QuadMapPatternS(User.iri_class().apply(UserRole.user_id),
                    SIOC.has_function, Role.iri_class().apply(UserRole.role_id),
                    name=QUADNAMES.class_UserRole_local)]


class LocalUserRole(DiscussionBoundBase):
    """The role that a user has in the context of a discussion"""
    __tablename__ = 'local_user_role'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id', ondelete='CASCADE', onupdate='CASCADE'))
    user = relationship(User, backref="local_roles")
    discussion_id = Column(Integer, ForeignKey(
        'discussion.id', ondelete='CASCADE'))
    discussion = relationship('Discussion')
    role_id = Column(Integer, ForeignKey('role.id', ondelete='CASCADE', onupdate='CASCADE'))
    role = relationship(Role, lazy="joined")
    # BUG in virtuoso: It will often refuse to create an index
    # whose name exists in another schema. So having this index in
    # schemas assembl and assembl_test always fails.
    # TODO: Bug virtuoso about this,
    # or introduce the schema name in the index name as workaround.
    # __table_args__ = (
    #     Index('user_discussion_idx', 'user_id', 'discussion_id'),)

    def get_discussion_id(self):
        return self.discussion_id

    @classmethod
    def get_discussion_condition(cls, discussion_id):
        return cls.id == discussion_id

    @classmethod
    def special_quad_patterns(cls, alias_manager):
        return [QuadMapPatternS(User.iri_class().apply(LocalUserRole.user_id),
            SIOC.has_function, Role.iri_class().apply(LocalUserRole.role_id),
            name=QUADNAMES.class_LocalUserRole)]


class Permission(Base):
    """A permission that a user may have"""
    __tablename__ = 'permission'
    id = Column(Integer, primary_key=True)
    name = Column(String(20), nullable=False)


def populate_default_permissions(session):
    perms = {p[0] for p in session.query(Permission.name).all()}
    for perm in ASSEMBL_PERMISSIONS - perms:
        session.add(Permission(name=perm))


class DiscussionPermission(DiscussionBoundBase):
    """Which permissions are given to which roles for a given discussion."""
    __tablename__ = 'discussion_permission'
    id = Column(Integer, primary_key=True)
    discussion_id = Column(Integer, ForeignKey(
        'discussion.id', ondelete='CASCADE', onupdate='CASCADE'))
    discussion = relationship(
        'Discussion', backref=backref("acls", lazy="joined"))
    role_id = Column(Integer, ForeignKey('role.id', ondelete='CASCADE', onupdate='CASCADE'))
    role = relationship(Role, lazy="joined")
    permission_id = Column(Integer, ForeignKey(
        'permission.id', ondelete='CASCADE', onupdate='CASCADE'))
    permission = relationship(Permission, lazy="joined")

    def role_name(self):
        return self.role.name

    def permission_name(self):
        return self.permission.name

    def get_discussion_id(self):
        return self.discussion_id

    @classmethod
    def get_discussion_condition(cls, discussion_id):
        return cls.id == discussion_id


def create_default_permissions(session, discussion):
    permissions = {p.name: p for p in session.query(Permission).all()}
    roles = {r.name: r for r in session.query(Role).all()}

    def add_perm(permission_name, role_names):
        # Note: Must be called within transaction manager
        for role in role_names:
            session.add(DiscussionPermission(
                discussion=discussion, role=roles[role],
                permission=permissions[permission_name]))
    add_perm(P_READ, [Everyone])
    add_perm(P_ADD_POST,
             [R_PARTICIPANT, R_CATCHER, R_MODERATOR, R_ADMINISTRATOR])
    add_perm(P_EDIT_POST, [R_MODERATOR, R_ADMINISTRATOR])
    add_perm(P_ADD_EXTRACT,
             [R_PARTICIPANT, R_CATCHER, R_MODERATOR, R_ADMINISTRATOR])
    add_perm(P_EDIT_EXTRACT, [R_MODERATOR, R_ADMINISTRATOR])
    add_perm(P_EDIT_MY_EXTRACT, [R_CATCHER, R_MODERATOR, R_ADMINISTRATOR])
    add_perm(P_ADD_IDEA, [R_CATCHER, R_MODERATOR, R_ADMINISTRATOR])
    add_perm(P_EDIT_IDEA, [R_CATCHER, R_MODERATOR, R_ADMINISTRATOR])
    add_perm(P_EDIT_SYNTHESIS, [R_MODERATOR, R_ADMINISTRATOR])
    add_perm(P_SEND_SYNTHESIS, [R_MODERATOR, R_ADMINISTRATOR])
    add_perm(P_ADMIN_DISC, [R_ADMINISTRATOR])
    add_perm(P_SYSADMIN, [R_ADMINISTRATOR])


class PartnerOrganization(DiscussionBoundBase):
    """A corporate entity"""
    __tablename__ = "partner_organization"
    id = Column(Integer, primary_key=True,
        info={'rdf': QuadMapPatternS(None, ASSEMBL.db_id)})

    discussion_id = Column(Integer, ForeignKey(
        "discussion.id", ondelete='CASCADE'),
        info={'rdf': QuadMapPatternS(None, DCTERMS.contributor)})
    discussion = relationship('Discussion', backref='partner_organizations')

    name = Column(Unicode(256),
        info={'rdf': QuadMapPatternS(None, FOAF.name)})

    description = Column(UnicodeText,
        info={'rdf': QuadMapPatternS(None, DCTERMS.description)})

    logo = Column(String(256),
        info={'rdf': QuadMapPatternS(None, FOAF.logo)})

    homepage = Column(String(256),
        info={'rdf': QuadMapPatternS(None, FOAF.homepage)})

    is_initiator = Column(Boolean)

    def get_discussion_id(self):
        return self.discussion_id

    @classmethod
    def get_discussion_condition(cls, discussion_id):
        return cls.discussion_id == discussion_id

    crud_permissions = CrudPermissions(P_ADMIN_DISC)
