from sqlalchemy.orm import relationship, backref

from .timeline import DiscussionBoundBase, DiscussionPhase
from .langstrings import LangString
from .langstrings_helpers import LangstringsMixin
from .sqla_helpers import Id, ForeignId

langstrings_names = [
    "instructions_section_title",
    "instructions_section_content",
    "propositions_section_title"
]

class VoteSession(
    LangstringsMixin(langstrings_names),
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
            single_parent = True,
            cascade = "all, delete-orphan"
        ),
    )
    
    def get_discussion_id(self):
        return self.discussion_phase.discussion_id

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return (cls.discussion_phase.discussion_id == discussion_id,)

LangString.setup_ownership_load_event(VoteSession, langstrings_names)