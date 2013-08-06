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
    Time,
    Binary
)

from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql import exists

from .password import hash_password, verify_password
from ..db import DBSession
from ..db.models import SQLAlchemyBaseModel


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
        return chain(self.identity_accounts(), self.email_accounts())

    __mapper_args__ = {
        'polymorphic_identity': 'agent_profile',
        'polymorphic_on': type
    }

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

    __mapper_args__ = {
        'polymorphic_identity': 'user',
    }

    def __init__(self, **kwargs):
        if kwargs.get('password'):
            kwargs['password'] = hash_password(kwargs['password'])

        super(User, self).__init__(**kwargs)

    def set_password(self, password):
        self.password = hash_password(password)

    def check_password(self, password):
        return verify_password(password, self.password)

    def send_email(self, **kwargs):
        subject = kwargs.get('subject', '')
        body = kwargs.get('body', '')

        # Send email.

    def __repr__(self):
        return "<User '%s'>" % self.username



# MAP @Jeff: If I understand well, you want generic foreign key.
# Not sure which is the best way to do this (before we move to RDF)
# Discussion here:
# http://stackoverflow.com/questions/17703239/sqlalchemy-generic-foreign-key-like-in-django-orm
class RestrictedAccessModel(SQLAlchemyBaseModel):
    """
    Represents a model with restricted access.

    Usually this means that only
    certain people will be allowed to read, write or perform other operations
    on or with instances of this model.
    """
    __tablename__ = "restricted_access_model"
    id = Column(Integer, primary_key=True)
    type = Column(String(60), nullable=False)

    owner_id = Column(Integer, ForeignKey(
        'agent_profile.id',
        ondelete='CASCADE'
    ))

    owner = relationship(
        "AgentProfile",
        backref=backref('restricted_access_models')
    )

    __mapper_args__ = {
        'polymorphic_identity': 'restricted_access_model',
        'polymorphic_on': type
    }

    def __repr__(self):
        return "<RestrictedAccessModel '%s'>" % self.type


# MAP @Jeff: Deleted permissions as we will use Pyramid ACLs.


class Action(SQLAlchemyBaseModel):
    """
    An action that can be taken by an actor.
    """
    __tablename__ = 'action'

    id = Column(Integer, primary_key=True)
    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)

    actor_id = Column(
        Integer,
        ForeignKey('agent_profile.id', ondelete='CASCADE'),
        nullable=False
    )

    actor = relationship(
        "AgentProfile",
        backref=backref('actions', order_by=creation_date)
    )

    verb = Column(Unicode(255), nullable=False)

    subject_id = Column(
        Integer,
        ForeignKey('restricted_access_model.id', ondelete='CASCADE'),
        nullable=False
    )

    subject = relationship(
        "RestrictedAccessModel",
        backref=backref('actions', order_by=creation_date)
    )

    def __repr__(self):
        return "<Action '%s'>" % " ".join([
            self.actor,
            'did',
            self.verb,
            'on',
            self.subject.type,
            '(%s)' % self.subject.id,
        ])
