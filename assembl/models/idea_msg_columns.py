"""The name and description of a category of messages under a given idea"""

from sqlalchemy import (
    Column,
    Boolean,
    Integer,
    SmallInteger,
    String,
    Unicode,
    Float,
    UnicodeText,
    DateTime,
    ForeignKey,
    inspect,
    select,
    func,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship, backref, aliased

from ..auth import (
    CrudPermissions, P_READ, P_ADMIN_DISC, P_EDIT_IDEA,
    P_ADD_IDEA)
from . import DiscussionBoundBase
from .idea import Idea
from .generic import Content


class IdeaMessageColumn(DiscussionBoundBase):
    __tablename__ = "idea_message_column"
    __table_args__ = (
        UniqueConstraint('idea_id', 'message_classifier'),)
    id = Column(Integer, primary_key=True)
    idea_id = Column(Integer, ForeignKey(Idea.id), index=True, nullable=False)
    message_classifier = Column(String(100), index=True, nullable=False,
        doc="Classifier for column views")
    header = Column(UnicodeText)
    previous_column_id = Column(Integer, ForeignKey(id), nullable=True, unique=True)

    idea = relationship(Idea, backref="message_columns")
    previous_column = relationship(
        "IdeaMessageColumn", remote_side=[id],
        backref=backref("next_column", uselist=False))

    def get_discussion_id(self):
        idea = self.idea or Idea.get(self.idea_id)
        return idea.get_discussion_id()

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        if alias_maker is None:
            idea_link = cls
            idea = Idea
        else:
            idea_link = alias_maker.alias_from_class(cls)
            idea = alias_maker.alias_from_relns(idea_link.source)
        return ((idea_link.source_id == idea.id),
                (idea.discussion_id == discussion_id))

    crud_permissions = CrudPermissions(P_ADMIN_DISC, P_READ)
