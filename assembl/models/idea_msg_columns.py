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
    event,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship, backref, aliased
from sqlalchemy.sql.functions import count

from ..auth import (
    CrudPermissions, P_READ, P_ADMIN_DISC, P_EDIT_IDEA,
    P_ADD_IDEA)
from . import DiscussionBoundBase
from .idea import Idea
from .generic import Content
from .langstrings import LangString


class IdeaMessageColumn(DiscussionBoundBase):
    """ A message column definition for an Idea """
    __tablename__ = "idea_message_column"
    __table_args__ = (
        UniqueConstraint('idea_id', 'message_classifier'),)
    id = Column(Integer, primary_key=True)
    idea_id = Column(Integer, ForeignKey(Idea.id), index=True, nullable=False,
        doc="The idea to which this column applies")
    message_classifier = Column(String(100), index=True, nullable=False,
        doc=("Identifier for the column, will match "
             ":py:attr:`assembl.models.generic.Content.message_classifier`"))
    header = Column(UnicodeText,
        doc="Text which will be shown above the column")
    previous_column_id = Column(
        Integer, ForeignKey(id, ondelete='SET NULL'),
        nullable=True, unique=True,
        doc="Allows ordering columns as a linked list")
    name_id = Column(Integer, ForeignKey(LangString.id), nullable=False,
        doc="The name of the column as a langstr")
    color = Column(String(20),
        doc="A CSS color that will be used to theme the column.")

    idea = relationship(Idea, backref="message_columns")
    previous_column = relationship(
        "IdeaMessageColumn", remote_side=[id],
        backref=backref("next_column", uselist=False))
    name = relationship(LangString, lazy="joined", backref=backref(
        "name_of_idea_message_column", uselist=False))

    def get_discussion_id(self):
        idea = self.idea or Idea.get(self.idea_id)
        return idea.get_discussion_id()

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        if alias_maker is None:
            msg_column = cls
            idea = Idea
        else:
            msg_column = alias_maker.alias_from_class(cls)
            idea = alias_maker.alias_from_relns(msg_column.idea)
        return ((msg_column.idea_id == idea.id),
                (idea.discussion_id == discussion_id))

    crud_permissions = CrudPermissions(
        P_ADMIN_DISC, P_READ, delete=P_ADMIN_DISC)

    @classmethod
    def ensure_ordering_for_idea(cls, idea):
        """Ensure all columns but one have a previous_column. The linked list is fragile."""
        columns = idea.message_columns
        columns_by_id = {c.id: c for c in columns}
        previous_ids = {c.previous_column_id for c in columns if c.previous_column_id is not None}
        list_ends = list(set(columns_by_id.keys()) - previous_ids)
        list_ends.sort()
        while len(list_ends) > 1:
            first_end = list_ends.pop(0)
            following = columns_by_id[list_ends[0]]
            # find the start of the list
            while following.previous_column:
                following = following.previous_column
            following.previous_column_id = first_end

    @classmethod
    def ensure_ordering(cls):
        """Find ideas with multiple columns that have no previous column"""
        db = cls.default_db
        subq = db.query(cls.idea_id
            ).filter_by(previous_column_id=None
            ).group_by(cls.idea_id
            ).having(count(cls.id) > 1).subquery()
        ideas = db.query(Idea).filter(Idea.id.in_(subq))
        for idea in ideas:
            cls.ensure_ordering_for_idea(idea)


LangString.setup_ownership_load_event(IdeaMessageColumn, ['name'])
