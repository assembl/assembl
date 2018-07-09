import enum
from sqlalchemy import (
    Column,
    Enum,
    Float,
    Integer,
    String,
    ForeignKey,
)
from sqlalchemy.orm import relationship, backref

from .auth import CrudPermissions, P_READ, P_ADMIN_DISC
from . import DiscussionBoundBase
from .langstrings import LangString
from ..lib.sqla_types import URLString
import assembl.graphql.docstrings as docs


class SectionTypesEnum(enum.Enum):

    HOMEPAGE = 'HOMEPAGE'
    DEBATE = 'DEBATE'
    SYNTHESES = 'SYNTHESES'
    RESOURCES_CENTER = 'RESOURCES_CENTER'
    CUSTOM = 'CUSTOM'
    ADMINISTRATION = 'ADMINISTRATION'


section_types = [t.value for t in SectionTypesEnum.__members__.values()]


class Section(DiscussionBoundBase):
    __doc__ = docs.Section.__doc__
    """Assembl configurable sections."""

    __tablename__ = "section"
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
            'sections',
            cascade="all, delete-orphan"),
    )

    title_id = Column(
        Integer(), ForeignKey(LangString.id))
    title = relationship(
        LangString,
        lazy="joined", single_parent=True,
        primaryjoin=title_id == LangString.id,
        backref=backref("section_from_title", lazy="dynamic"),
        cascade="all, delete-orphan")

    url = Column(URLString)

    section_type = Column(
        Enum(*section_types, name='section_types'),
        nullable=False,
        default=SectionTypesEnum.CUSTOM.value,
        server_default=SectionTypesEnum.CUSTOM.value,
        doc=docs.Section.section_type
    )

    order = Column(
        Float, nullable=False, default=0.0, doc=docs.Section.order)

    def get_discussion_id(self):

        return self.discussion_id or self.discussion.id

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return (cls.discussion_id == discussion_id,)

    __mapper_args__ = {
        'polymorphic_identity': 'section',
        'polymorphic_on': type,
        'with_polymorphic': '*'
    }

    crud_permissions = CrudPermissions(
        P_ADMIN_DISC, P_READ, P_ADMIN_DISC, P_ADMIN_DISC)


LangString.setup_ownership_load_event(Section, ['title'])
