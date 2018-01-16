from sqlalchemy.orm import relationship, backref

from .timeline import DiscussionBoundBase, DiscussionPhase
from .langstrings import LangString
from .langstrings_helpers import langstrings_base
from .sqla_helpers import Id, ForeignId
from assembl.auth import CrudPermissions, P_READ, P_ADMIN_DISC

langstrings_names = [
    "title",
    "sub_title",
    "instructions_section_title",
    "instructions_section_content",
    "propositions_section_title"
]


class VoteSession(
    langstrings_base(langstrings_names, "VoteSession"),
    DiscussionBoundBase
):
    """ A vote session bound to a discussion phase.
        Uses TimelineEvent.description as frontend subtitle. """

    __tablename__ = "vote_session"

    id = Id()

    discussion_phase_id = ForeignId(
        DiscussionPhase,
        nullable=False,
    )

    discussion_phase = relationship(
        DiscussionPhase,
        backref=backref(
            "vote_session",
            single_parent=True,
            uselist=False,
            cascade="all, delete-orphan"
        ),
    )

    def get_discussion_id(self):
        return self.discussion_phase.discussion_id

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return (cls.discussion_phase.discussion_id == discussion_id,)

    crud_permissions = CrudPermissions(
        create=P_ADMIN_DISC,
        read=P_READ,
        update=P_ADMIN_DISC,
        delete=P_ADMIN_DISC)


LangString.setup_ownership_load_event(VoteSession, langstrings_names)
