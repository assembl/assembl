from datetime import datetime

from sqlalchemy.orm import relationship, backref
from sqlalchemy import (
    Boolean,
    Column,
    Integer,
    ForeignKey
)

from assembl.auth import CrudPermissions, P_READ, P_ADMIN_DISC
from .langstrings import LangString
from .langstrings_helpers import langstrings_base
from .timeline import DiscussionPhase
from .widgets import VotingWidget

langstrings_names = [
    "title",
    "sub_title",
    "instructions_section_title",
    "instructions_section_content",
    "propositions_section_title"
]


class VoteSession(
    langstrings_base(langstrings_names, "VoteSession"),
    VotingWidget
):
    """ A vote session bound to a discussion phase.
        Uses TimelineEvent.description as frontend subtitle. """

    __tablename__ = "vote_session"
    __mapper_args__ = {
        'polymorphic_identity': 'vote_session',
    }

    id = Column(Integer, ForeignKey(
        VotingWidget.id,
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    discussion_phase_id = Column(
        Integer,
        ForeignKey(DiscussionPhase.id),
        nullable=False)

    discussion_phase = relationship(
        DiscussionPhase,
        backref=backref(
            "vote_session",
            single_parent=True,
            uselist=False,
            cascade="all, delete-orphan"
        ),
    )

    see_current_votes = Column(
        Boolean,
        nullable=False,
        server_default='0',
        default=False)

    @classmethod
    def filter_started(cls, query):
        return query.join(cls.discussion_phase).filter(
            (DiscussionPhase.start == None) | (DiscussionPhase.start <= datetime.utcnow()))  # noqa: E711

    @classmethod
    def test_active(cls):
        now = datetime.utcnow()
        return ((DiscussionPhase.end == None) | (DiscussionPhase.end > now) & (DiscussionPhase.start == None) | (DiscussionPhase.start <= now))  # noqa: E711

    @classmethod
    def filter_active(cls, query):
        return query.join(cls.discussion_phase).filter(cls.test_active())

    def is_started(self):
        return self.discussion_phase.start == None or self.discussion_phase.start <= datetime.utcnow()  # noqa: E711

    def is_ended(self):
        return self.discussion_phase.end != None and self.discussion_phase.end < datetime.utcnow()  # noqa: E711

    crud_permissions = CrudPermissions(
        create=P_ADMIN_DISC,
        read=P_READ,
        update=P_ADMIN_DISC,
        delete=P_ADMIN_DISC)


LangString.setup_ownership_load_event(VoteSession, langstrings_names)
