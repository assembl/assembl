# -*- coding=utf-8 -*-
"""Landing page related models."""
from sqlalchemy import (
    Boolean,
    Column,
    Float,
    Integer,
    String,
    ForeignKey,
)
from sqlalchemy.orm import relationship, backref

from assembl.sqla import Base
from assembl.auth import CrudPermissions, P_SYSADMIN, P_READ
from assembl.lib.sqla_types import URLString
from .langstrings import LangString


class LandingPageModuleType(Base):

    """Landing page module type."""

    __tablename__ = "landing_page_module_type"
    type = Column(String(60), nullable=False)

    id = Column(Integer, primary_key=True)

    title_id = Column(
        Integer(), ForeignKey(LangString.id))
    title = relationship(
        LangString,
        lazy="joined", single_parent=True,
        primaryjoin=title_id == LangString.id,
        backref=backref("landing_page_module_type_from_title", lazy="dynamic"),
        cascade="all, delete-orphan")

    helper_img_url = Column(URLString)

    default_order = Column(Float, nullable=False)

    editable_order = Column(Boolean, default=True)

    required = Column(Boolean, default=False)

    __mapper_args__ = {
        'polymorphic_identity': 'landing_page_module_type',
        'polymorphic_on': type,
        'with_polymorphic': '*'
    }

    crud_permissions = CrudPermissions(P_SYSADMIN, P_READ, P_SYSADMIN, P_SYSADMIN)


LangString.setup_ownership_load_event(LandingPageModuleType, ['title'])
