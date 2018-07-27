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
from sqlalchemy.dialects.postgresql.json import JSONB
from sqlalchemy.orm import relationship, backref

import assembl.graphql.docstrings as docs
from . import DiscussionBoundBase
from ..auth import CrudPermissions, P_ADMIN_DISC, P_READ
from .langstrings import LangString


class ConfigurableFieldIdentifiersEnum(enum.Enum):

    EMAIL = 'EMAIL'
    FULLNAME = 'FULLNAME'
    PASSWORD = 'PASSWORD'
    PASSWORD2 = 'PASSWORD2'
    USERNAME = 'USERNAME'
    CUSTOM = 'CUSTOM'


identifiers = [t.value for t in ConfigurableFieldIdentifiersEnum.__members__.values()]


class AbstractConfigurableField(DiscussionBoundBase):

    """Abstract configurable field."""

    __tablename__ = "configurable_field"

    type = Column(String(60), nullable=False)

    __mapper_args__ = {
        'polymorphic_identity': 'abstract_configurable_field',
        'polymorphic_on': 'type',
        'with_polymorphic': '*'
    }

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

    identifier = Column(
        Enum(*identifiers, name='configurable_field_identifiers'),
        nullable=False,
        default=ConfigurableFieldIdentifiersEnum.CUSTOM.value,
        server_default=ConfigurableFieldIdentifiersEnum.CUSTOM.value
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

    hidden = Column(Boolean(), default=False, server_default='0')

    def get_discussion_id(self):
        return self.discussion_id or self.discussion.id

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return (cls.discussion_id == discussion_id,)

    crud_permissions = CrudPermissions(
        P_ADMIN_DISC, P_READ, P_ADMIN_DISC, P_ADMIN_DISC)


LangString.setup_ownership_load_event(AbstractConfigurableField, ['title'])


class TextFieldsTypesEnum(enum.Enum):

    TEXT = 'TEXT'
    EMAIL = 'EMAIL'
    PASSWORD = 'PASSWORD'


field_types = [t.value for t in TextFieldsTypesEnum.__members__.values()]


class TextField(AbstractConfigurableField):

    """Configurable text field."""

    __tablename__ = "text_field"
    __mapper_args__ = {
        'polymorphic_identity': 'text_field'
    }

    id = Column(
        Integer,
        ForeignKey(AbstractConfigurableField.id, ondelete="CASCADE", onupdate="CASCADE"),
        primary_key=True)

    field_type = Column(
        Enum(*field_types, name='text_field_types'),
        nullable=False,
        default=TextFieldsTypesEnum.TEXT.value,
        server_default=TextFieldsTypesEnum.TEXT.value,
        doc=docs.TextField.field_type
    )


class SelectField(AbstractConfigurableField):

    """Configurable select field."""

    __tablename__ = "select_field"
    __mapper_args__ = {
        'polymorphic_identity': 'select_field'
    }

    id = Column(
        Integer,
        ForeignKey(AbstractConfigurableField.id, ondelete="CASCADE", onupdate="CASCADE"),
        primary_key=True)

    multivalued = Column(Boolean, default=False, doc=docs.SelectField.multivalued)

    crud_permissions = CrudPermissions(
        P_ADMIN_DISC, P_READ, P_ADMIN_DISC, P_ADMIN_DISC)


class SelectFieldOption(DiscussionBoundBase):

    """This represents an option in a select field."""

    __tablename__ = "select_field_option"

    id = Column(Integer, primary_key=True)
    order = Column(Float, nullable=False, default=0.0, doc=docs.SelectFieldOption.order)
    label_id = Column(Integer, ForeignKey(LangString.id), nullable=False, index=True)
    select_field_id = Column(
        Integer, ForeignKey(
            SelectField.id, ondelete='CASCADE', onupdate='CASCADE'),
        nullable=False, index=True)

    select_field = relationship(
        SelectField, foreign_keys=(select_field_id,),
        backref=backref("options", order_by="SelectFieldOption.order", cascade="all, delete-orphan"))
    label = relationship(
        LangString, foreign_keys=(label_id,),
        backref=backref("label_of_option", lazy="dynamic"),
        single_parent=True,
        lazy="joined",
        cascade="all, delete-orphan")

    def get_discussion_id(self):
        field = self.select_field or SelectField.get(self.select_field_id)
        return field.get_discussion_id()

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        if alias_maker is None:
            option = cls
            field = SelectField
        else:
            option = alias_maker.alias_from_class(cls)
            field = alias_maker.alias_from_relns(option.select_field)
        return ((option.select_field_id == field.id),
                (field.discussion_id == discussion_id))

    crud_permissions = CrudPermissions(
        P_ADMIN_DISC, P_READ, P_ADMIN_DISC, P_ADMIN_DISC)


LangString.setup_ownership_load_event(SelectFieldOption, ['label'])


class ProfileField(DiscussionBoundBase):

    """Field for profile page."""

    __tablename__ = "profile_field"
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
        backref=backref('profile_fields', cascade="all, delete-orphan")
    )

    configurable_field_id = Column(
        Integer,
        ForeignKey(
            'configurable_field.id', ondelete='CASCADE', onupdate='CASCADE'
        ),
        nullable=False, index=True
    )
    configurable_field = relationship(
        "AbstractConfigurableField",
        backref=backref('profile_field', cascade="all, delete-orphan")
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
        backref=backref('profile_field', cascade="all, delete-orphan")
    )

    value_data = Column(JSONB)

    def get_discussion_id(self):
        return self.discussion_id or self.discussion.id

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return (cls.discussion_id == discussion_id,)

    __mapper_args__ = {
        'polymorphic_identity': 'profile_field',
        'polymorphic_on': type,
        'with_polymorphic': '*'
    }

    def is_owner(self, user_id):
        return self.agent_profile_id == user_id

    crud_permissions = CrudPermissions(
        P_READ, P_READ, P_ADMIN_DISC, P_ADMIN_DISC,
        # owned:
        P_READ, P_READ)
