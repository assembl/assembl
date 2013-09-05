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
from ..db import DBSession
from ..lib import config
from ..lib.sqla import Base as SQLAlchemyBaseModel


# Roles
R_PARTICIPANT = 'r:participant'
R_CATCHER = 'r:catcher'
R_MODERATOR = 'r:moderator'
R_ADMINISTRATOR = 'r:administrator'

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

    def accounts(self):
        """All AgentAccounts for this profile"""
        return chain(self.identity_accounts, self.email_accounts)

    def verified_emails(self):
        return (e for e in self.email_accounts if e.verified)

    __mapper_args__ = {
        'polymorphic_identity': 'agent_profile',
        'polymorphic_on': type
    }

    def display_name(self):
        # TODO: Prefer types?
        for acc in self.accounts():
            name = acc.display_name()
            if name:
                return name
        return self.name

    def merge(self, other_profile):
        def idp_sig(idp):
            return (idp.provider_id, idp.username, idp.domain, idp.userid)
        emails = {e.email: e for e in self.email_accounts}
        idp_accounts = {idp_sig(idp): idp
                        for idp in self.identity_accounts}
        for ea in other_profile.email_accounts:
            if ea.email in emails:
                if ea.verified:
                    emails[ea.email].verified = True
                DBSession.delete(ea.email)
            else:
                ea.profile = self
        for idp in other_profile.identity_accounts:
            if idp_sig(idp) in idp_accounts:
                DBSession.delete(idp)
            else:
                idp.profile = self
        if other_profile.user:
            if self.user:
                self.user.merge(other_profile.user)
            else:
                other_profile.user.profile = self
        if other_profile.name and not self.name:
            self.name = other_profile.name
        # TODO: similarly for posts        
        for action in DBSession.query(Action).filter_by(
            actor_id=other_profile.id).all():
                action.actor = self
        DBSession.delete(other_profile)

    def has_permission(self, verb, subject):
        if self is subject.owner:
            return True

        return DBSession.query(Permission).filter_by(
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
            accounts = self.email_accounts
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
            hashlib.md5(email.lower()).hexdigest(), size, urllib.quote(default))
        return gravatar_url

    def serializable(self, use_email=None):
        r = {
            'type': "AgentProfile",
            'id': self.id,
            'name': self.name or self.display_name()
        }
        if use_email:
            r['email'] = use_email
        if self.user:
            r['type'] = 'User'
            r['username'] = self.user.username
            if not use_email:
                r['email'] = self.user.get_preferred_email()
        return r


class AgentAccount(SQLAlchemyBaseModel):
    __abstract__ = True
    """An abstract class for accounts that identify agents"""
    pass


class EmailAccount(AgentAccount):
    """An email account"""
    __tablename__ = "email_account"
    id = Column(Integer, primary_key=True)
    email = Column(String(100), nullable=False, index=True)
    verified = Column(Boolean(), default=False)
    preferred = Column(Boolean(), default=False)
    active = Column(Boolean(), default=True)
    profile_id = Column(
        Integer,
        ForeignKey('agent_profile.id', ondelete='CASCADE'),
        nullable=False, index=True)
    profile = relationship('AgentProfile', backref='email_accounts')

    def display_name(self):
        if self.verified:
            return self.email

    def serialize_profile(self):
        return self.profile.serializable(self.email)

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


class IdentityProviderAccount(AgentAccount):
    """An account with an external identity provider"""
    __tablename__ = "idprovider_account"
    id = Column(Integer, primary_key=True)
    provider_id = Column(
        Integer,
        ForeignKey('identity_provider.id', ondelete='CASCADE'),
        nullable=False)
    provider = relationship(IdentityProvider)
    profile_id = Column(
        Integer,
        ForeignKey('agent_profile.id', ondelete='CASCADE'),
        nullable=False)
    profile = relationship('AgentProfile', backref='identity_accounts')
    username = Column(String(200))
    domain = Column(String(200))
    userid = Column(String(200))

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

    username = Column(Unicode(20), unique=True)
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
        emails = list(self.profile.email_accounts)
        # should I allow unverified?
        emails = [e for e in emails if e.verified]
        preferred = [e for e in emails if e.preferred]
        if preferred:
            return preferred[0].email
        if emails:
            return emails[0].email

    def merge(self, other_user):
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
        for user_role in DBSession.query(UserRole).filter_by(
                user_id=other_user.id).all():
            user_role.user = self
        for local_user_role in DBSession.query(LocalUserRole).filter_by(
                user_id=other_user.id).all():
            user_role.user = self
        for extract in other_user.extracts_created:
            extract.creator = self
        for extract in other_user.extracts_owned:
            extract.owner = self
        for discussion in other_user.discussions:
            discussion.owner = self
        DBSession.delete(other_user)

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
            return self.username
        return self.profile.display_name()

    def serializable(self):
        return self.profile.serializable()

    def __repr__(self):
        return "<User '%s'>" % self.username


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


class UserRole(SQLAlchemyBaseModel):
    """roles that a user has globally (eg admin.)"""
    __tablename__ = 'user_role'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id', ondelete='CASCADE'),
                     index=True)
    user = relationship(User)
    role_id = Column(Integer, ForeignKey('role.id', ondelete='CASCADE'))
    role = relationship(Role)


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
    role = relationship(Role)
    __table_args__ = (
        Index('user_discussion_idx', 'user_id', 'discussion_id'),)


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


class DiscussionPermission(SQLAlchemyBaseModel):
    """Which permissions are given to which roles for a given discussion."""
    __tablename__ = 'discussion_permission'
    id = Column(Integer, primary_key=True)
    discussion_id = Column(Integer, ForeignKey(
        'discussion.id', ondelete='CASCADE'))
    discussion = relationship('Discussion')
    role_id = Column(Integer, ForeignKey('role.id', ondelete='CASCADE'))
    role = relationship(Role)
    permission_id = Column(Integer, ForeignKey(
        'permission.id', ondelete='CASCADE'))
    permission = relationship(Permission)


def create_default_permissions(session, discussion):
    permissions = {p.name: p.id for p in session.query(Permission).all()}
    roles = {r.name: r.id for r in session.query(Role).all()}
    def add_perm(permission_name, role_names):
        # Note: Must be called within transaction manager
        for role in role_names:
            session.add(DiscussionPermission(
                discussion=discussion, role_id=roles[role],
                permission_id=permissions[permission_name]))
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
        'polymorphic_on': type
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

