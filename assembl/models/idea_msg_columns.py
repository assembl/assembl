"""The name and description of a category of messages under a given idea"""

from pyramid.threadlocal import get_current_request
from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql.functions import count

import assembl.graphql.docstrings as docs
from ..auth import CrudPermissions, P_READ, P_ADMIN_DISC
from . import DiscussionBoundBase
from .idea import Idea
from .idea_content_link import IdeaContentLink, IdeaRelatedPostLink
from .generic import Content
from .langstrings import LangString
from .post import ColumnSynthesisPost


class IdeaMessageColumn(DiscussionBoundBase):
    """ A message column definition for an Idea """
    __tablename__ = "idea_message_column"
    __table_args__ = (
        UniqueConstraint('idea_id', 'message_classifier'),)
    id = Column(Integer, primary_key=True)
    idea_id = Column(Integer, ForeignKey(Idea.id), index=True, nullable=False,
                     doc="The idea to which this column applies")
    message_classifier = Column(String(100), index=True, nullable=False,
                                doc=docs.IdeaMessageColumn.message_classifier)
    previous_column_id = Column(
        Integer, ForeignKey(id, ondelete='SET NULL'),
        nullable=True, unique=True,
        doc="Allows ordering columns as a linked list")
    name_id = Column(Integer, ForeignKey(LangString.id), nullable=False,
                     doc="The name of the column as a langstr")
    title_id = Column(Integer, ForeignKey(LangString.id), nullable=True,
                      doc="The title of the column as a langstr")
    color = Column(String(20),
                   doc="A CSS color that will be used to theme the column.")

    idea = relationship(Idea, backref="message_columns")
    previous_column = relationship(
        "IdeaMessageColumn", remote_side=[id],
        backref=backref("next_column", uselist=False))
    name = relationship(LangString,
                        lazy="joined", single_parent=True,
                        primaryjoin=name_id == LangString.id,
                        backref=backref("name_of_idea_message_column", lazy="dynamic"),
                        cascade="all, delete-orphan")
    title = relationship(LangString,
                         lazy="joined", single_parent=True,
                         primaryjoin=title_id == LangString.id,
                         backref=backref("title_of_idea_message_column", lazy="dynamic"),
                         cascade="all, delete-orphan")

    def get_discussion_id(self):
        idea = self.idea or Idea.get(self.idea_id)
        return idea.get_discussion_id()

    def get_positional_index(self):
        def rec(node, count):
            if not node.previous_column:
                return count
            else:
                return rec(node.previous_column, count + 1)

        return rec(self, 0)

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

    def get_column_synthesis(self):
        synthesis = self.db.query(ColumnSynthesisPost
            ).join(ColumnSynthesisPost.idea_links_of_content
            ).filter(
                IdeaContentLink.idea_id == self.idea_id,
                ColumnSynthesisPost.tombstone_date == None,  # noqa: E711
                Content.message_classifier == self.message_classifier
            ).all()
        return synthesis[0] if synthesis else None

    def create_column_synthesis(self, subject=None, body=None,
                                creator_id=None):
        user_id = creator_id or \
            get_current_request().authenticated_userid
        synthesis = ColumnSynthesisPost(
            message_classifier=self.message_classifier,
            discussion_id=self.idea.discussion_id,
            subject=subject if subject else LangString.EMPTY(),
            body=body if body else LangString.EMPTY()
        )
        idea_post_link = IdeaRelatedPostLink(
            creator_id=user_id,
            content=synthesis,
            idea=self.idea
        )
        self.db.add(synthesis)
        self.db.add(idea_post_link)
        self.db.flush()
        return synthesis

    def set_column_synthesis(self, subject=None, body=None, creator_id=None):
        # Only use after self has been created! This should never be used
        # for side-effectful APIs
        synthesis = self.get_column_synthesis()
        assert synthesis
        if subject is not None:
            synthesis.subject = subject

        if body is not None:
            synthesis.body = body

        self.db.flush()

    @property
    def header(self):
        synthesis = self.get_column_synthesis()
        if synthesis is None:
            return None

        return synthesis.body

    @header.setter
    def header(self, value):
        # If None is passed, a synthesis object will be created downstream
        # with an empty body and title
        if value:
            self.set_column_synthesis(body=value)

    @property
    def synthesis_title(self):
        synthesis = self.get_column_synthesis()
        if synthesis is None:
            return None

        return synthesis.subject

    @synthesis_title.setter
    def synthesis_title(self, value):
        # If None is passed, a synthesis object will be created downstream
        # with an empty body and title
        if value:
            self.set_column_synthesis(subject=value)


LangString.setup_ownership_load_event(IdeaMessageColumn, ['name', 'title'])
