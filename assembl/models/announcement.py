"""Announcements are similar to messages, but editable."""
from sqlalchemy import (
    Column,
    Integer,
    DateTime,
    String,
    Boolean,
    ForeignKey,
    event
)
from sqlalchemy.orm import relationship, backref

from datetime import datetime
from . import DiscussionBoundBase
from .idea import Idea
from .langstrings import LangString
from assembl.auth import (
    CrudPermissions,
    P_READ,
    P_ADMIN_DISC,
    P_ADD_IDEA,
    P_EDIT_IDEA
)
from .auth import AgentProfile


class Announcement(DiscussionBoundBase):
    """
    Represents an announcement.  Similar to a message, but editable, meant to be displayed on top of the messagelist for an idea.
    """
    __tablename__ = "announce"
    id = Column(
        Integer, primary_key=True)

    type = Column(String(60), nullable=False)

    discussion_id = Column(Integer, ForeignKey(
        'discussion.id',
        ondelete='CASCADE',
        onupdate='CASCADE',
        ),
        nullable=False, index=True)

    discussion = relationship(
        "Discussion",
        backref=backref(
            'announcements',
            cascade="all, delete-orphan"),
    )

    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)

    modification_date = Column(DateTime, nullable=False, default=datetime.utcnow)

    creator_id = Column(Integer, ForeignKey('agent_profile.id'),
                        nullable=False)
    creator = relationship(
        AgentProfile,
        foreign_keys=[creator_id], backref="announcements_created")

    last_updated_by_id = Column(
        Integer, ForeignKey('agent_profile.id'), nullable=False)
    last_updated_by = relationship(
        AgentProfile,
        foreign_keys=[last_updated_by_id], backref="announcements_updated")

    title_id = Column(
        Integer(), ForeignKey(LangString.id))
    body_id = Column(
        Integer(), ForeignKey(LangString.id))
    title = relationship(
        LangString,
        lazy="joined", single_parent=True,
        primaryjoin=title_id == LangString.id,
        backref=backref("announcement_from_title", lazy="dynamic"),
        cascade="all, delete-orphan")
    body = relationship(
        LangString,
        lazy="joined", single_parent=True,
        primaryjoin=body_id == LangString.id,
        backref=backref("announcement_from_body", lazy="dynamic"),
        cascade="all, delete-orphan")

    # temporary
    @property
    def title_(self):
        return self.title.first_original().value if self.title else ''

    # temporary
    @property
    def body_(self):
        return self.body.first_original().value if self.body else ''

    __mapper_args__ = {
        'polymorphic_identity': 'announce',
        'with_polymorphic': '*',
        'polymorphic_on': 'type'
    }

    def get_discussion_id(self):
        return self.discussion_id or self.discussion.id

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return (cls.discussion_id == discussion_id,)


LangString.setup_ownership_load_event(
    Announcement, ['title', 'body'])


class IdeaAnnouncement(Announcement):
    """An announcement attached to an idea"""
    __tablename__ = "idea_announce"
    id = Column(Integer, ForeignKey(
        'announce.id',
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    idea_id = Column(Integer, ForeignKey(
        'idea.id',
        ondelete='CASCADE',
        onupdate='CASCADE',
        ),
        nullable=False,
        index=True)

    idea = relationship(
        Idea,
        backref=backref(
            'announcement',
            # One-to-one relationship
            uselist=False,
            cascade="all, delete-orphan"),
    )

    # Should this announcement propagate down to it's descendant ideas in the messageList?
    should_propagate_down = Column(Boolean, nullable=False, server_default='0')

    __mapper_args__ = {
        'polymorphic_identity': 'idea_announce',
        'with_polymorphic': '*'
    }

    # Same crud permissions as a idea
    crud_permissions = CrudPermissions(
        P_ADD_IDEA, P_READ, P_EDIT_IDEA, P_ADMIN_DISC, P_ADMIN_DISC,
        P_ADMIN_DISC)


@event.listens_for(IdeaAnnouncement.idea, 'set',
                   propagate=True, active_history=True)
def attachment_object_attached_to_set_listener(target, value,
                                               oldvalue, initiator):

    # print "attachment_object_attached_to_set_listener for target:\
    #      %s set to %s, was %s" % (target, value, oldvalue)

    if oldvalue is not None:
        with oldvalue.db.no_autoflush:
            oldvalue.send_to_changes()
    if value is not None:
        with value.db.no_autoflush:
            value.send_to_changes()
