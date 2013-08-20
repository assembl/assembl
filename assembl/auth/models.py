from datetime import datetime
from itertools import chain
import urllib
import hashlib

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

from .password import hash_password, verify_password
from ..db import DBSession
from ..lib import config
from ..lib.sqla import Base as SQLAlchemyBaseModel


class AgentAccount(SQLAlchemyBaseModel):
    __abstract__ = True
    """An abstract class for accounts that identify agents"""
    pass


class IdentityProvider(SQLAlchemyBaseModel):
    """An identity provider (or sometimes a category of identity providers.)"""
    __tablename__ = "identity_provider"
    id = Column(Integer, primary_key=True)
    provider_type = Column(String(20), nullable=False)
    name = Column(String(60), nullable=False)
    # TODO: More complicated model, where trust also depends on realm.
    trust_emails = Column(Boolean, default=False)


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
        return ":".join((self.provider.type, name))


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

    def avatar_url(self, size=32):
        # First implementation: Use the gravatar URL
        # TODO: store user's choice of avatar.
        email = self.get_preferred_email()
        default = config.get('avatar.default_image_url') or \
                             '/static/img/icon/user.png'
        gravatar_url = "http://www.gravatar.com/avatar/" + \
            hashlib.md5(email.lower()).hexdigest() + "?"
        gravatar_url += urllib.urlencode({'d': default, 's': str(size)})
        return gravatar_url

    def display_name(self):
        if self.username:
            return self.username
        return self.profile.display_name

    def __repr__(self):
        return "<User '%s'>" % self.username


class Role(SQLAlchemyBaseModel):
    """A role that a user may have in a discussion"""
    __tablename__ = 'role'
    id = Column(Integer, primary_key=True)
    name = Column(String(20), nullable=False)


class UserRole(SQLAlchemyBaseModel):
    """roles that a user has globally (eg admin.)"""
    __tablename__ = 'user_role'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id', ondelete='CASCADE'),
                     index=True)
    role_id = Column(Integer, ForeignKey('role.id', ondelete='CASCADE'))


class LocalUserRole(SQLAlchemyBaseModel):
    """The role that a user has in the context of a discussion"""
    __tablename__ = 'local_user_role'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id', ondelete='CASCADE'))
    discussion_id = Column(Integer, ForeignKey(
        'discussion.id', ondelete='CASCADE'))
    role_id = Column(Integer, ForeignKey('role.id', ondelete='CASCADE'))
    __table_args__ = (
        Index('user_discussion_idx', 'user_id', 'discussion_id'),)


class Action(SQLAlchemyBaseModel):
    """
    An action that can be taken by an actor.
    """
    __tablename__ = 'action'

    id = Column(Integer, primary_key=True)
    type = Column(Unicode(255), nullable=False)
    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)

    __mapper_args__ = {
        'polymorphic_identity': 'agent_profile',
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
                self.actor,
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



class View(ActionOnPost):
    """
    A view action on a post.
    """
    __tablename__ = 'view'
    __mapper_args__ = {
        'polymorphic_identity': 'view'
    }

    id = Column(
        Integer, 
        ForeignKey('action.id', ondelete="CASCADE"),
        primary_key=True
    )

    verb = 'viewed'



class Expand(ActionOnPost):
    """
    An expansion action on a post.
    """
    __tablename__ = 'expand'
    __mapper_args__ = {
        'polymorphic_identity': 'expand'
    }

    id = Column(
        Integer, 
        ForeignKey('action.id', ondelete="CASCADE"),
        primary_key=True
    )

    verb = 'expanded'



class Collapse(ActionOnPost):
    """
    A collapse action on a post.
    """
    __tablename__ = 'collapse'
    __mapper_args__ = {
        'polymorphic_identity': 'collapse'
    }

    id = Column(
        Integer, 
        ForeignKey('action.id', ondelete="CASCADE"),
        primary_key=True
    )

    verb = 'collapseed'

