# -*- coding=utf-8 -*-
"""Landing page related models."""
from sqlalchemy import (
    Boolean,
    Column,
    Float,
    Integer,
    String,
    ForeignKey,
    UnicodeText
)
from sqlalchemy.orm import relationship, backref

import assembl.graphql.docstrings as docs
from assembl.lib.sqla import Base
from assembl.auth import CrudPermissions, P_ADMIN_DISC, P_SYSADMIN, P_READ
from . import DiscussionBoundBase
from .langstrings import LangString


module_types = [
    {
        u'identifier': u'HEADER',
        u'title': {
            u'en': u'Header',
            u'fr': u'Bandeau header'
        },
        u'default_order': 1.0,
        u'editable_order': False,
        u'required': True
    },
    {
        u'identifier': 'INTRODUCTION',
        u'title': {
            u'en': u'Text & Multimedia',
            u'fr': u'Texte & Multimédia'
        },
        u'default_order': 2.0,
        u'editable_order': True,
        u'required': False
    },
    {
        u'identifier': 'TIMELINE',
        u'title': {
            u'en': u'Timeline',
            u'fr': u'Timeline'
        },
        u'default_order': 3.0,
        u'editable_order': True,
        u'required': True
    },
    {
        u'identifier': 'FOOTER',
        u'title': {
            u'en': u'Footer',
            u'fr': u'Footer'
        },
        u'default_order': 99.0,
        u'editable_order': False,
        u'required': True
    },
    {
        u'identifier': 'TOP_THEMATICS',
        u'title': {
            u'en': u'Top thematics',
            u'fr': u'Thématiques à la une'
        },
        u'default_order': 4.0
    },
    {
        u'identifier': 'TWEETS',
        u'title': {
            u'en': u'Tweets',
            u'fr': u'Tweets'
        },
        u'default_order': 5.0
    },
    {
        u'identifier': 'CHATBOT',
        u'title': {
            u'en': u'Chatbot',
            u'fr': u'Chatbot'
        },
        u'default_order': 7.0
    },
    {
        u'identifier': 'CONTACT',
        u'title': {
            u'en': u'Contact',
            u'fr': u'Contact'
        },
        u'default_order': 8.0
    },
    {
        u'identifier': 'NEWS',
        u'title': {
            u'en': u'News',
            u'fr': u'Actualités à la une'
        },
        u'default_order': 9.0
    },
    {
        u'identifier': 'DATA',
        u'title': {
            u'en': u'Data',
            u'fr': u'Module bandeau Data'
        },
        u'default_order': 10.0
    },
    {
        u'identifier': 'PARTNERS',
        u'title': {
            u'en': u'Partners',
            u'fr': u'Partenaires'
        },
        u'default_order': 11.0
    },
]


class LandingPageModuleType(Base):

    """Landing page module type."""

    __tablename__ = "landing_page_module_type"
    type = Column(String(60), nullable=False)

    id = Column(Integer, primary_key=True)

    identifier = Column(String(30), nullable=False, doc=docs.LandingPageModuleType.identifier)

    title_id = Column(
        Integer(), ForeignKey(LangString.id))
    title = relationship(
        LangString,
        lazy="joined", single_parent=True,
        primaryjoin=title_id == LangString.id,
        backref=backref("landing_page_module_type_from_title", lazy="dynamic"),
        cascade="all, delete-orphan")

    default_order = Column(Float, nullable=False, doc=docs.LandingPageModuleType.default_order)

    editable_order = Column(Boolean, default=True, doc=docs.LandingPageModuleType.editable_order)

    required = Column(Boolean, default=False, doc=docs.LandingPageModuleType.required)

    __mapper_args__ = {
        'polymorphic_identity': 'landing_page_module_type',
        'polymorphic_on': type,
        'with_polymorphic': '*'
    }

    crud_permissions = CrudPermissions(P_SYSADMIN, P_READ, P_SYSADMIN, P_SYSADMIN)

    @classmethod
    def populate_db(cls, db=None):
        engine = db.bind
        # table may not exist (alembic migration)
        if engine.dialect.has_table(engine.connect(), "landing_page_module_type"):
            db.execute("lock table %s in exclusive mode" % cls.__table__.name)
            current_module_types = [item[0] for item in db.query(cls.identifier).all()]
            for info in module_types:
                if info['identifier'] not in current_module_types:
                    kw = info.copy()
                    title = None
                    for locale, value in info[u'title'].items():
                        if title:
                            title.add_value(value, locale)

                        title = LangString.create(value, locale)

                    kw['title'] = title
                    saobj = LandingPageModuleType(**kw)
                    db.add(saobj)


LangString.setup_ownership_load_event(LandingPageModuleType, ['title'])


class LandingPageModule(DiscussionBoundBase):

    """Landing page module for a discussion."""

    __tablename__ = "landing_page_module"
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
        backref=backref('landing_page_modules', cascade="all, delete-orphan")
    )

    module_type_id = Column(
        Integer,
        ForeignKey(
            'landing_page_module_type.id', ondelete='CASCADE', onupdate='CASCADE'
        ),
        nullable=False, index=True
    )
    module_type = relationship(
        "LandingPageModuleType",
        backref=backref('landing_page_modules', cascade="all, delete-orphan")
    )

    configuration = Column(UnicodeText, doc=docs.LandingPageModule.configuration)

    order = Column(Float, nullable=False, doc=docs.LandingPageModule.order)

    enabled = Column(Boolean, default=False, doc=docs.LandingPageModule.enabled)

    title_id = Column(Integer(), ForeignKey(LangString.id))
    title = relationship(
        LangString, lazy="joined", single_parent=True, primaryjoin=title_id == LangString.id,
        backref=backref("module_from_title", lazy="dynamic"), cascade="all, delete-orphan")

    subtitle_id = Column(Integer(), ForeignKey(LangString.id))
    subtitle = relationship(
        LangString, lazy="joined", single_parent=True, primaryjoin=subtitle_id == LangString.id,
        backref=backref("module_from_subtitle", lazy="dynamic"), cascade="all, delete-orphan")

    def get_discussion_id(self):
        return self.discussion_id or self.discussion.id

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return (cls.discussion_id == discussion_id,)

    __mapper_args__ = {
        'polymorphic_identity': 'landing_page_module',
        'polymorphic_on': type,
        'with_polymorphic': '*'
    }

    crud_permissions = CrudPermissions(
        P_ADMIN_DISC, P_READ, P_ADMIN_DISC, P_ADMIN_DISC)


LangString.setup_ownership_load_event(LandingPageModule, ['title', 'subtitle'])
