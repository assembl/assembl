from datetime import datetime

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



class OrganizationalUnit(Model):
    """
    An organizational unit could be a person, group, bot or computer.
    """
    __tablename__ = "organizational_unit"

    id = Column(Integer, primary_key=True)
    name = Column(Unicode(1024))
    type = Column(String(60), nullable=False)

    __mapper_args__ = {
        'polymorphic_identity': 'organizational_unit',
        'polymorphic_on': type
    }


class User(OrganizationalUnit):
    """
    A Human user.
    """
    __tablename__ = "user"

    id = Column(
        Integer, 
        ForeignKey('organizational_unit.id', ondelete='CASCADE'), 
        primary_key=True
    )

    username = Column(Unicode(20), unique=True, nullable=False)
    email = Column(Unicode(50), nullable=False)

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


class RestrictedAccessModel(Model):
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
        'organizational_unit.id', 
        ondelete='CASCADE'
    ))

    owner = relationship(
        "OrganizationalUnit", 
        backref=backref('restricted_access_models')
    )

    __mapper_args__ = {
        'polymorphic_identity': 'restricted_access_model',
        'polymorphic_on': type
    }

    def __repr__(self):
        return "<RestrictedAccessModel '%s'>" % self.type


class Permission(Model):
    """
    A Permission determines the level of access that a user has to a particular
    part of the system.

    example usage:

        Permission(
            organizational_unit=some_user,
            action="write", 
            subject=some_restricted_access_model
        )

        <Permission 'Allow jeff write on table_of_contents (1)'>
    """
    __tablename__ = "permission"

    id = Column(Integer, primary_key=True)
    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)

    allow = Column(Boolean, default=True)
    
    organizational_unit_id = Column(
        Integer,
        ForeignKey('organizational_unit.id', ondelete='CASCADE')
    )

    organizational_unit = relationship(
        "OrganizationalUnit",
        backref=backref('permissions', order_by=creation_date)
    )

    action = Column(Unicode(255), nullable=False)

    subject_id = Column(
        Integer, 
        ForeignKey('restricted_access_model.id', ondelete='CASCADE'),
    )

    subject = relationship(
        "RestrictedAccessModel",
        backref=backref('permissions', order_by=creation_date)
    )

    def __repr__(self):
        return "<Permission '%s'>" % " ".join([
            'Allow' if self.allow else 'Deny',
            self.user.username,
            self.permission,
            'on',
            self.subject.type,
            '(%s)' % self.subject.id,
        ])
