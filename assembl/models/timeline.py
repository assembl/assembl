"""Models for a timeline of the conversation. Unused as of yet."""

from enum import Enum

from sqlalchemy.orm import relationship, backref
from sqlalchemy import (
    Column,
    Integer,
    Boolean,
    String,
    DateTime,
    ForeignKey,
    inspect,
    Float
)

from . import DiscussionBoundBase
from ..auth import CrudPermissions, P_READ, P_ADMIN_DISC
from ..lib.sqla_types import URLString
from .discussion import Discussion
from .idea import Idea
from .langstrings import LangString


class Phases(Enum):
    survey = 'survey'
    thread = 'thread'
    multiColumns = 'multiColumns'
    voteSession = 'voteSession'
    brightMirror = 'brightMirror'


PHASES_WITH_POSTS = [
    Phases.survey.value,
    Phases.thread.value,
    Phases.multiColumns.value
]


def get_phase_by_identifier(discussion, identifier):
    filtered_phases = [phase for phase in discussion.timeline_events
                       if phase.identifier == identifier]
    if not filtered_phases:
        return None

    return filtered_phases[0]


class TimelineEvent(DiscussionBoundBase):
    """Abstract event that will be shown in the timeline."""
    __tablename__ = 'timeline_event'

    id = Column(Integer, primary_key=True)

    discussion_id = Column(Integer, ForeignKey(
        'discussion.id',
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), nullable=False, index=True)

    type = Column(String(60), nullable=False)

    __mapper_args__ = {
        'polymorphic_identity': 'timeline_event',
        'polymorphic_on': type,
        'with_polymorphic': '*'
    }

    identifier = Column(String(60),
                        doc="An identifier for front-end semantics")

    title_id = Column(
        Integer(), ForeignKey(LangString.id), nullable=False)

    description_id = Column(
        Integer(), ForeignKey(LangString.id))

    title = relationship(
        LangString,
        lazy="joined", single_parent=True,
        primaryjoin=title_id == LangString.id,
        backref=backref("title_of_timeline_event", lazy="dynamic"),
        cascade="all, delete-orphan")

    description = relationship(
        LangString,
        lazy="joined", single_parent=True,
        primaryjoin=description_id == LangString.id,
        backref=backref("description_of_timeline_event", lazy="dynamic"),
        cascade="all, delete-orphan")

    image_url = Column(URLString())

    is_thematics_table = Column(
        Boolean, server_default='false', default=False)

    start = Column(DateTime)

    end = Column(DateTime)

    order = Column(Float, nullable=False, default=0.0, server_default='0')

    # Since dates are optional, the previous event pointer allows
    # dateless events to form a linked list.
    # Ideally we could use a uniqueness constraint but
    # that disallows multiple NULLs.
    # Also, the linked list defines lanes.
    previous_event_id = Column(Integer, ForeignKey(
        'timeline_event.id', ondelete="SET NULL"), nullable=True)

    previous_event = relationship(
        "TimelineEvent", remote_side=[id], post_update=True, uselist=False,
        backref=backref("next_event", uselist=False,
                        remote_side=[previous_event_id]))

    def __init__(self, **kwargs):
        previous_event_id = None
        previous_event = None
        if 'previous_event' in kwargs:
            previous_event = kwargs['previous_event']
            del kwargs['previous_event']
        if 'previous_event_id' in kwargs:
            previous_event_id = kwargs['previous_event_id']
            del kwargs['previous_event_id']
        super(TimelineEvent, self).__init__(**kwargs)
        if previous_event is not None:
            self.set_previous_event(previous_event)
        elif previous_event_id is not None:
            self.set_previous_event_id(previous_event_id)

    discussion = relationship(
        Discussion,
        backref=backref(
            'timeline_events', order_by=start,
            cascade="all, delete-orphan")
    )

    def set_previous_event(self, previous_event):
        # This allows setting the previous event as an insert.
        # this method may not be reliable with unflushed objects.
        self.set_previous_event_id(
            previous_event.id if previous_event is not None else None)
        self.previous_event = previous_event
        previous_event.next_event = self

    def set_previous_event_id(self, previous_event_id):
        if previous_event_id != self.previous_event_id:
            # TODO: Detect and avoid cycles
            if previous_event_id is not None:
                existing = self.__class__.get_by(
                    previous_event_id=previous_event_id)
                if existing:
                    existing.previous_event = self
            if inspect(self).persistent:
                self.db.expire(self, ['previous_event'])
            elif 'previous_event' in self.__dict__:
                del self.__dict__['previous_event']
            self.previous_event_id = previous_event_id

    def get_discussion_id(self):
        return self.discussion_id

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return (cls.discussion_id == discussion_id,)

    crud_permissions = CrudPermissions(
        P_ADMIN_DISC, P_READ, P_ADMIN_DISC, P_ADMIN_DISC)


LangString.setup_ownership_load_event(TimelineEvent, ['title', 'description'])


class DiscussionPhase(TimelineEvent):
    """A phase of the discussion.
    Ideally, the discussion should always be in one and only one phase,
    so they should ideally not overlap, though this is not enforced."""

    __tablename__ = "discussion_phase"

    id = Column(Integer, ForeignKey(
        TimelineEvent.id,
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    __mapper_args__ = {
        'polymorphic_identity': 'discussion_phase',
    }

    interface_v1 = Column(Boolean, server_default='false', default=False)
    root_idea_id = Column(
        Integer,
        ForeignKey('idea.id', onupdate="CASCADE", ondelete="SET NULL"))
    root_idea = relationship(
        Idea,
        backref=backref('discussion_phase', uselist=False),
    )


Discussion.timeline_phases = relationship(
    DiscussionPhase, order_by=TimelineEvent.order)


class DiscussionSession(TimelineEvent):
    """A session within the discussion, such as creativity or vote.
    It may overlap with phases."""
    __mapper_args__ = {
        'polymorphic_identity': 'discussion_session',
    }


Discussion.timeline_sessions = relationship(
    DiscussionPhase, order_by=TimelineEvent.start)


class DiscussionMilestone(TimelineEvent):
    """This is a point in time, not an interval."""
    # Not worth an extra table, but we'll disallow "end".

    def __init__(self, **kwargs):
        if 'end' in kwargs:
            del kwargs['end']
        super(DiscussionMilestone, self).__init__(**kwargs)

    end = None

    __mapper_args__ = {
        'polymorphic_identity': 'discussion_milestone',
    }


Discussion.timeline_milestones = relationship(
    DiscussionPhase, order_by=TimelineEvent.start)
