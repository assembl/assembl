from datetime import datetime
from itertools import chain

from sqlalchemy import (
    Boolean,
    Column,
    String,
    ForeignKey,
    Integer,
    Unicode,
    DateTime,
)

from sqlalchemy.orm import relationship, backref

from .utils import hash_password
from ..db.models import Model


class AgentAccount(Model):
    __abstract__ = True
    """An abstract class for accounts that identify agents"""
    pass


class IdentityProvider(Model):
    """An identity provider (or sometimes a category of identity providers.)"""
    __tablename__ = "identity_provider"
    id = Column(Integer, primary_key=True)
    name = Column(String(20), nullable=False)
    # TODO: More complicated model, where trust also depends on realm.
    trust_emails = Column(Boolean, default=False)


class EmailAccount(AgentAccount):
    """An email account"""
    __tablename__ = "email_account"
    email = Column(String(100), primary_key=True)
    verified = Column(Boolean(), default=False)
    preferred = Column(Boolean(), default=False)
    active = Column(Boolean(), default=True)
    profile_id = Column(
        Integer,
        ForeignKey('agent_profile.id', ondelete='CASCADE'),
        nullable=False)
    profile = relationship('AgentProfile', backref='email_accounts')


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


class IdentityProviderEmail(Model):
    """An email that is proposed by the identity provider.
    Not confirmed by default."""
    __tablename__ = "idprovider_email"
    email = Column(String(100), nullable=False, primary_key=True)
    verified = Column(Boolean(), default=False)
    preferred = Column(Boolean(), default=False)
    active = Column(Boolean(), default=True)
    provider_id = Column(
        Integer,
        ForeignKey('identity_provider.id', ondelete='CASCADE'),
        nullable=False, primary_key=True)
    provider = relationship(IdentityProvider, backref='emails')


class AgentProfile(Model):
    """
    An agent could be a person, group, bot or computer.
    Profiles describe agents, which have multiple accounts.
    Some agents might also be users of the platforms.
    """
    __tablename__ = "agent_profile"

    id = Column(Integer, primary_key=True)
    name = Column(Unicode(1024))
    type = Column(String(60), nullable=False)  # not sure we need this?

    def accounts(self):
        """All AgentAccounts for this profile"""
        return chain(self.identity_accounts(), self.email_accounts())

    __mapper_args__ = {
        'polymorphic_identity': 'agent_profile',
        'polymorphic_on': type
    }


class User(Model):
    """
    A Human user.
    """
    __tablename__ = "user"

    id = Column(
        Integer,
        ForeignKey('agent_profile.id', ondelete='CASCADE'),
        primary_key=True
    )
    profile = relationship(AgentProfile)

    username = Column(Unicode(20), unique=True, nullable=False)
    preferred_email = Column(Unicode(50), nullable=False)
    verified = Column(Boolean(), default=False)
    password = Column(Unicode(115), nullable=False)
    last_login = Column(DateTime)
    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)

    __mapper_args__ = {
        'polymorphic_identity': 'user',
    }

    def __init__(self, **kwargs):
        if kwargs.get('password'):
            kwargs['password'] = hash_password(kwargs['password'])

        super(User, self).__init__(**kwargs)

    def set_password(password):
        self.password = hash_password(password)

    def check_password(password):
        return hash_password(password) == self.password

    def send_email(**kwargs):
        subject = kwargs.get('subject', '')
        body = kwargs.get('body', '')

        # Send email.

    def __repr__(self):
        return "<User '%s'>" % self.username

# Note on permissions: we will use Pyramid ACLs.
