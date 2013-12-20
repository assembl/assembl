from datetime import datetime
from itertools import chain
import urllib
import hashlib
import transaction

from sqlalchemy import (
    Boolean,
    Column,
    String,
    ForeignKey,
    Integer,
    Unicode,
    DateTime,
    Time,
    Binary,
    Index
)

from sqlalchemy.orm import relationship, backref
from pyramid.security import Everyone, Authenticated

from .password import hash_password, verify_password
from ..lib import config
from ..lib.sqla import Base as SQLAlchemyBaseModel


# Roles
R_PARTICIPANT = 'r:participant'
R_CATCHER = 'r:catcher'
R_MODERATOR = 'r:moderator'
R_ADMINISTRATOR = 'r:administrator'
R_SYSADMIN = 'r:sysadmin'

SYSTEM_ROLES = set(
    (Everyone, Authenticated, R_PARTICIPANT, R_CATCHER,
     R_MODERATOR, R_ADMINISTRATOR, R_SYSADMIN))

# Permissions
P_READ = 'read'
P_ADD_POST = 'add_post'
P_EDIT_POST = 'edit_post'
P_DELETE_POST = 'delete_post'
P_ADD_EXTRACT = 'add_extract'
P_DELETE_EXTRACT = 'delete_extract'
P_EDIT_EXTRACT = 'edit_extract'
P_ADD_IDEA = 'add_idea'
P_EDIT_IDEA = 'edit_idea'
P_EDIT_SYNTHESIS = 'edit_synthesis'
P_SEND_SYNTHESIS = 'send_synthesis'
P_ADMIN_DISC = 'admin_discussion'
P_SYSADMIN = 'sysadmin'


class AgentProfile(SQLAlchemyBaseModel):
    """
    An agent could be a person, group, bot or computer.
    Profiles describe agents, which have multiple accounts.
    Some agents might also be users of the platforms.
    """
    __tablename__ = "agent_profile"

    id = Column(Integer, primary_key=True)
    name = Column(Unicode(1024))
    type = Column(String(60))  # not sure we need this?

    __mapper_args__ = {
        'polymorphic_identity': 'agent_profile',
        'polymorphic_on': type,
        'with_polymorphic': '*'
    }

    def identity_accounts(self):
        return self.db.query(
            IdentityProviderAccount
            ).join(AbstractAgentAccount
            ).filter_by(profile_id=self.id)

    def email_accounts(self):
        return self.db.query(
            EmailAccount
            ).join(AbstractAgentAccount
            ).filter_by(profile_id=self.id)

    def verified_emails(self):
        # TODO: Filter request? Is there a way to know if preloaded?
        return (e for e in self.email_accounts() if e.verified)

    def display_name(self):
        # TODO: Prefer types?
        for acc in self.accounts:
            name = acc.display_name()
            if name:
                return name
        return self.name

    def merge(self, other_profile):
        session = self.db
        my_accounts = {a.signature(): a for a in self.accounts}
        for other_account in other_profile.accounts:
            my_account = my_accounts.get(other_account.signature())
            if my_account:
                my_account.merge(other_account)
                session.delete(other_account)
            else:
                other_account.profile = self
        if other_profile.user:
            if self.user:
                self.user.merge(other_profile.user)
            else:
                other_profile.user.profile = self
        if other_profile.name and not self.name:
            self.name = other_profile.name
        # TODO: similarly for posts
        for action in session.query(Action).filter_by(
            actor_id=other_profile.id).all():
                action.actor = self
        session.delete(other_profile)

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
        # First implementation: Use the gravatar URL
        if self.user and not email:
            email = self.user.preferred_email
        if not email:
            accounts = list(self.email_accounts())
            if accounts:
                accounts.sort(key=lambda e: (e.verified, e.preferred))
                email = accounts[-1].email
        default = config.get('avatar.default_image_url') or \
            (app_url and app_url+'/static/img/icon/user.png')
        if not email:
            return default
        args = {'s': str(size)}
        if default:
            args['d'] = default
        gravatar_url = "http://www.gravatar.com/avatar/%s?s=%d&amp;d=%s" % (
            hashlib.md5(
                email.lower()).hexdigest(), size, urllib.quote(default))
        return gravatar_url

    def serializable(self, use_email=None):
        r = {
            '@type': self.external_typename(),
            '@id': self.uri_generic(self.id),
            'name': self.name or self.display_name()
        }
        # if use_email:
        #     r['email'] = use_email
        if self.user:
            r['@type'] = 'User'
            r['username'] = self.user.display_name()
            # if not use_email:
            #     r['email'] = self.user.get_preferred_email()
        return r


class AbstractAgentAccount(SQLAlchemyBaseModel):
    """An abstract class for accounts that identify agents"""
    __tablename__ = "abstract_agent_account"
    id = Column(Integer, primary_key=True)
    type = Column(String(60))
    profile_id = Column(
        Integer,
        ForeignKey('agent_profile.id', ondelete='CASCADE'),
        nullable=False)
    profile = relationship('AgentProfile', backref='accounts')
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
        ondelete='CASCADE'
    ), primary_key=True)
    email = Column(String(100), nullable=False, index=True)
    verified = Column(Boolean(), default=False)
    preferred = Column(Boolean(), default=False)
    active = Column(Boolean(), default=True)

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

    @staticmethod
    def get_or_make_profile(session, email, name=None):
        emails = list(session.query(EmailAccount).filter_by(
            email=email).all())
        # We do not want unverified user emails
        # This is costly. I should have proper boolean markers
        emails = [e for e in emails if e.verified or not e.profile.user]
        user_emails = [e for e in emails if e.profile.user]
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


class IdentityProvider(SQLAlchemyBaseModel):
    """An identity provider (or sometimes a category of identity providers.)"""
    __tablename__ = "identity_provider"
    id = Column(Integer, primary_key=True)
    provider_type = Column(String(20), nullable=False)
    name = Column(String(60), nullable=False)
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
        ondelete='CASCADE'
    ), primary_key=True)
    provider_id = Column(
        Integer,
        ForeignKey('identity_provider.id', ondelete='CASCADE'),
        nullable=False)
    provider = relationship(IdentityProvider)
    username = Column(String(200))
    domain = Column(String(200))
    userid = Column(String(200))

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


class User(SQLAlchemyBaseModel):
    """
    A Human user.
    """
    __tablename__ = "user"

    id = Column(
        Integer,
        ForeignKey('agent_profile.id', ondelete='CASCADE'),
        primary_key=True
    )
    profile = relationship(
        AgentProfile, backref=backref("user", uselist=False))

    preferred_email = Column(Unicode(50))
    verified = Column(Boolean(), default=False)
    password = Column(Binary(115))
    timezone = Column(Time(True))
    last_login = Column(DateTime)
    login_failures = Column(Integer(4), default=0)
    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)

    def __init__(self, **kwargs):
        if kwargs.get('password'):
            kwargs['password'] = hash_password(kwargs['password'])

        super(User, self).__init__(**kwargs)

    def set_password(self, password):
        self.password = hash_password(password)

    def check_password(self, password):
        return verify_password(password, self.password)

    def get_preferred_email(self):
        if self.preferred_email:
            return self.preferred_email
        emails = list(self.profile.email_accounts())
        # should I allow unverified?
        emails = [e for e in emails if e.verified]
        preferred = [e for e in emails if e.preferred]
        if preferred:
            return preferred[0].email
        if emails:
            return emails[0].email

    def merge(self, other_user):
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
        for user_role in session.query(UserRole).filter_by(
                user_id=other_user.id).all():
            user_role.user = self
        for local_user_role in session.query(LocalUserRole).filter_by(
                user_id=other_user.id).all():
            user_role.user = self
        for extract in other_user.extracts_created:
            extract.creator = self
        for extract in other_user.extracts_owned:
            extract.owner = self
        for discussion in other_user.discussions:
            discussion.owner = self
        if other_user.username and not self.username:
            self.username = other_user.username
        session.delete(other_user)

    def send_email(self, **kwargs):
        subject = kwargs.get('subject', '')
        body = kwargs.get('body', '')

        # Send email.

    def avatar_url(self, size=32, app_url=None):
        # First implementation: Use the gravatar URL
        # TODO: store user's choice of avatar.
        return self.profile.avatar_url(size, app_url, self.preferred_email)

    def display_name(self):
        if self.username:
            return self.username.username
        return self.profile.display_name()

    def serializable(self):
        return self.profile.serializable()

    def __repr__(self):
        return "<User '%s'>" % self.username

    def get_permissions(self, discussion_id):
        from . import get_permissions
        return get_permissions(self.id, discussion_id)

    def get_all_permissions(self):
        from . import get_permissions
        from ..models import Discussion
        permissions = {
            Discussion.uri_generic(d_id): get_permissions(self.id, d_id)
            for (d_id,) in self.db.query(Discussion.id)}
        return permissions


class Username(SQLAlchemyBaseModel):
    "Optional usernames for users"
    __tablename__ = 'username'
    user_id = Column(Integer,
                     ForeignKey('user.id', ondelete='CASCADE'),
                     unique=True)
    username = Column(Unicode(20), primary_key=True)
    user = relationship(User, backref=backref('username', uselist=False))

    def get_id_as_str(self):
        return str(self.user_id)

class Role(SQLAlchemyBaseModel):
    """A role that a user may have in a discussion"""
    __tablename__ = 'role'
    id = Column(Integer, primary_key=True)
    name = Column(String(20), nullable=False)

    @classmethod
    def get_role(klass, session, name):
        return session.query(klass).filter_by(name=name).first()


def populate_default_roles(session):
    def ensure(s):
        # Note: Must be called within transaction manager
        if not session.query(Role).filter_by(name=s).first():
            session.add(Role(name=s))
    ensure(Everyone)
    ensure(Authenticated)
    ensure(R_PARTICIPANT)
    ensure(R_CATCHER)
    ensure(R_MODERATOR)
    ensure(R_ADMINISTRATOR)
    ensure(R_SYSADMIN)


class UserRole(SQLAlchemyBaseModel):
    """roles that a user has globally (eg admin.)"""
    __tablename__ = 'user_role'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id', ondelete='CASCADE'),
                     index=True)
    user = relationship(User)
    role_id = Column(Integer, ForeignKey('role.id', ondelete='CASCADE'))
    role = relationship(Role, lazy="joined")


class LocalUserRole(SQLAlchemyBaseModel):
    """The role that a user has in the context of a discussion"""
    __tablename__ = 'local_user_role'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id', ondelete='CASCADE'))
    user = relationship(User)
    discussion_id = Column(Integer, ForeignKey(
        'discussion.id', ondelete='CASCADE'))
    discussion = relationship('Discussion')
    role_id = Column(Integer, ForeignKey('role.id', ondelete='CASCADE'))
    role = relationship(Role, lazy="joined")
    # BUG in virtuoso: It will often refuse to create an index
    # whose name exists in another schema. So having this index in
    # schemas assembl and assembl_test always fails.
    # TODO: Bug virtuoso about this,
    # or introduce the schema name in the index name as workaround.
    # __table_args__ = (
    #     Index('user_discussion_idx', 'user_id', 'discussion_id'),)


class Permission(SQLAlchemyBaseModel):
    """A permission that a user may have"""
    __tablename__ = 'permission'
    id = Column(Integer, primary_key=True)
    name = Column(String(20), nullable=False)


def populate_default_permissions(session):
    def ensure(s):
        # Note: Must be called within transaction manager
        if not session.query(Permission).filter_by(name=s).first():
            session.add(Permission(name=s))
    ensure(P_READ)
    ensure(P_ADD_POST)
    ensure(P_EDIT_POST)
    ensure(P_DELETE_POST)
    ensure(P_ADD_EXTRACT)
    ensure(P_EDIT_EXTRACT)
    ensure(P_DELETE_EXTRACT)
    ensure(P_ADD_IDEA)
    ensure(P_EDIT_IDEA)
    ensure(P_EDIT_SYNTHESIS)
    ensure(P_SEND_SYNTHESIS)
    ensure(P_ADMIN_DISC)
    ensure(P_SYSADMIN)


class DiscussionPermission(SQLAlchemyBaseModel):
    """Which permissions are given to which roles for a given discussion."""
    __tablename__ = 'discussion_permission'
    id = Column(Integer, primary_key=True)
    discussion_id = Column(Integer, ForeignKey(
        'discussion.id', ondelete='CASCADE'))
    discussion = relationship(
        'Discussion', backref=backref("acls", lazy="joined"))
    role_id = Column(Integer, ForeignKey('role.id', ondelete='CASCADE'))
    role = relationship(Role, lazy="joined")
    permission_id = Column(Integer, ForeignKey(
        'permission.id', ondelete='CASCADE'))
    permission = relationship(Permission, lazy="joined")

    def role_name(self):
        return self.role.name

    def permission_name(self):
        return self.permission.name

    def get_discussion_id(self):
        return self.discussion_id

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
    add_perm(P_DELETE_POST, [R_MODERATOR, R_ADMINISTRATOR])
    add_perm(P_ADD_EXTRACT,
             [R_PARTICIPANT, R_CATCHER, R_MODERATOR, R_ADMINISTRATOR])
    add_perm(P_EDIT_EXTRACT, [R_CATCHER, R_MODERATOR, R_ADMINISTRATOR])
    add_perm(P_DELETE_EXTRACT, [R_CATCHER, R_MODERATOR, R_ADMINISTRATOR])
    add_perm(P_ADD_IDEA, [R_CATCHER, R_MODERATOR, R_ADMINISTRATOR])
    add_perm(P_EDIT_IDEA, [R_CATCHER, R_MODERATOR, R_ADMINISTRATOR])
    add_perm(P_EDIT_SYNTHESIS, [R_MODERATOR, R_ADMINISTRATOR])
    add_perm(P_SEND_SYNTHESIS, [R_MODERATOR, R_ADMINISTRATOR])
    add_perm(P_ADMIN_DISC, [R_ADMINISTRATOR])
    add_perm(P_SYSADMIN, [R_ADMINISTRATOR])


class Action(SQLAlchemyBaseModel):
    """
    An action that can be taken by an actor.
    """
    __tablename__ = 'action'

    id = Column(Integer, primary_key=True)
    type = Column(Unicode(255), nullable=False)
    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)

    __mapper_args__ = {
        'polymorphic_identity': 'action',
        'polymorphic_on': type,
        'with_polymorphic': '*'
    }

    actor_id = Column(
        Integer,
        ForeignKey('user.id', ondelete='CASCADE'),
        nullable=False
    )

    actor = relationship(
        "User",
        backref=backref('actions', order_by=creation_date)
    )

    verb = 'did something to'

    def __repr__(self):

        return "<%s '%s'>" % (
            self.__class__.__name__,
            " ".join([
                self.actor.display_name() if self.actor else 'nobody',
                self.verb,
                self.object_type
            ])
        )


class ActionOnPost(Action):
    """
    An action that is taken on a post. (Mixin)
    """

    post_id = Column(
        Integer,
        ForeignKey('post.id', ondelete="CASCADE"),
        nullable=False
    )

    post = relationship(
        'Post',
        backref=backref('views')
    )

    object_type = 'post'

    def get_discussion_id(self):
        return self.post.get_discussion_id()


class ViewPost(ActionOnPost):
    """
    A view action on a post.
    """
    __tablename__ = 'action_view_post'
    __mapper_args__ = {
        'polymorphic_identity': 'view_post'
    }

    id = Column(
        Integer,
        ForeignKey('action.id', ondelete="CASCADE"),
        primary_key=True
    )

    verb = 'viewed'


class ExpandPost(ActionOnPost):
    """
    An expansion action on a post.
    """
    __tablename__ = 'action_expand_post'
    __mapper_args__ = {
        'polymorphic_identity': 'expand_post'
    }

    id = Column(
        Integer,
        ForeignKey('action.id', ondelete="CASCADE"),
        primary_key=True
    )

    verb = 'expanded'


class CollapsePost(ActionOnPost):
    """
    A collapse action on a post.
    """
    __tablename__ = 'action_collapse_post'
    __mapper_args__ = {
        'polymorphic_identity': 'collapse_post'
    }

    id = Column(
        Integer,
        ForeignKey('action.id', ondelete="CASCADE"),
        primary_key=True
    )

    verb = 'collapsed'
