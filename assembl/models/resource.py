from sqlalchemy import (
    Column,
    Float,
    Integer,
    String,
    UnicodeText,
    ForeignKey,
)
from sqlalchemy.orm import relationship, backref

from assembl.auth import CrudPermissions, P_MANAGE_RESOURCE, P_READ
from . import DiscussionBoundBase
from .langstrings import LangString
import assembl.graphql.docstrings as docs


class Resource(DiscussionBoundBase):

    """Resource for resources center."""

    __tablename__ = "resource"
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
            'resources',
            cascade="all, delete-orphan"),
    )

    title_id = Column(
        Integer(), ForeignKey(LangString.id))
    text_id = Column(
        Integer(), ForeignKey(LangString.id))
    title = relationship(
        LangString,
        lazy="joined", single_parent=True,
        primaryjoin=title_id == LangString.id,
        backref=backref("resource_from_title", lazy="dynamic"),
        cascade="all, delete-orphan")
    text = relationship(
        LangString,
        lazy="joined", single_parent=True,
        primaryjoin=text_id == LangString.id,
        backref=backref("resource_from_text", lazy="dynamic"),
        cascade="all, delete-orphan")

    embed_code = Column(UnicodeText)

    order = Column(
        Float, nullable=False, default=0.0, doc=docs.Resource.order)

    def get_discussion_id(self):
        return self.discussion_id or self.discussion.id

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return (cls.discussion_id == discussion_id,)

    __mapper_args__ = {
        'polymorphic_identity': 'resource',
        'polymorphic_on': type,
        'with_polymorphic': '*'
    }

    crud_permissions = CrudPermissions(
        P_MANAGE_RESOURCE, P_READ, P_MANAGE_RESOURCE, P_MANAGE_RESOURCE,
        P_MANAGE_RESOURCE, P_MANAGE_RESOURCE)


LangString.setup_ownership_load_event(Resource, ['title', 'text'])
