"""Configurable fields."""
# -*- coding=utf-8 -*-
import enum

from sqlalchemy import (
    Boolean,
    Column,
    Enum,
    String,
    Float,
    ForeignKey,
    Integer
)
from sqlalchemy.orm import relationship, backref

from . import DiscussionBoundBase
from ..auth import CrudPermissions, P_ADMIN_DISC, P_READ
from .langstrings import LangString


class TextFieldsTypesEnum(enum.Enum):

    TEXT = 'TEXT'
    EMAIL = 'EMAIL'
    PASSWORD = 'PASSWORD'


field_types = [t.value for t in TextFieldsTypesEnum.__members__.values()]


class TextField(DiscussionBoundBase):

    """Configurable text field."""

    __tablename__ = "text_field"
    type = Column(String(60), nullable=False)

    id = Column(Integer, primary_key=True)

    discussion_id = Column(
        Integer,
        ForeignKey(
            'discussion.id',
            ondelete='CASCADE',
            onupdate='CASCADE',
        ),
        nullable=False, index=True)

    discussion = relationship(
        "Discussion",
        backref=backref(
            'text_fields',
            cascade="all, delete-orphan"),
    )

    title_id = Column(
        Integer(), ForeignKey(LangString.id))
    title = relationship(
        LangString,
        lazy="joined", single_parent=True,
        primaryjoin=title_id == LangString.id,
        backref=backref("text_field_from_title", lazy="dynamic"),
        cascade="all, delete-orphan")

    order = Column(
        Float, nullable=False, default=0.0)

    required = Column(Boolean(), default=False)

    field_type = Column(
        Enum(*field_types, name='text_field_types'),
        nullable=False,
        default=TextFieldsTypesEnum.TEXT.value,
        server_default=TextFieldsTypesEnum.TEXT.value
    )

    def get_discussion_id(self):
        return self.discussion_id or self.discussion.id

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return (cls.discussion_id == discussion_id,)

    __mapper_args__ = {
        'polymorphic_identity': 'text_field',
        'polymorphic_on': type,
        'with_polymorphic': '*'
    }

    crud_permissions = CrudPermissions(
        P_ADMIN_DISC, P_READ, P_ADMIN_DISC, P_ADMIN_DISC)


LangString.setup_ownership_load_event(TextField, ['title'])


class ProfileTextField(DiscussionBoundBase):

    """Text field for profile page."""

    __tablename__ = "profile_text_field"
    type = Column(String(60), nullable=False)

    id = Column(Integer, primary_key=True)

    discussion_id = Column(
        Integer,
        ForeignKey(
            'discussion.id',
            ondelete='CASCADE',
            onupdate='CASCADE',
        ),
        nullable=False, index=True)

    discussion = relationship(
        "Discussion",
        backref=backref('profile_text_fields', cascade="all, delete-orphan")
    )

    text_field_id = Column(
        Integer,
        ForeignKey(
            'text_field.id', ondelete='CASCADE', onupdate='CASCADE'
        ),
        nullable=False, index=True
    )
    text_field = relationship(
        "TextField",
        backref=backref('profile_text_field', cascade="all, delete-orphan")
    )

    agent_profile_id = Column(
        Integer,
        ForeignKey(
            'agent_profile.id', ondelete='CASCADE', onupdate='CASCADE'
        ),
        nullable=False, index=True
    )
    agent_profile = relationship(
        "AgentProfile",
        backref=backref('profile_text_field', cascade="all, delete-orphan")
    )

    value = Column(String(60))

    def get_discussion_id(self):
        return self.discussion_id or self.discussion.id

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return (cls.discussion_id == discussion_id,)

    __mapper_args__ = {
        'polymorphic_identity': 'profile_text_field',
        'polymorphic_on': type,
        'with_polymorphic': '*'
    }

    crud_permissions = CrudPermissions(
        P_READ, P_READ, P_ADMIN_DISC, P_ADMIN_DISC,
        # owned:
        P_READ, P_READ)
