from sqlalchemy.orm import relationship, backref

from .timeline import DiscussionBoundBase, DiscussionPhase
from .langstrings import LangString
from .langstrings_helpers import LangStringId, langstring_relationship
from .sqla_helpers import Id, ForeignId

class VoteSession(DiscussionBoundBase):
    """ A vote session bound to a discussion phase.
        Uses TimelineEvent.description as frontend subtitle. """
        
    __tablename__ = "vote_session"

    id = Id()
    discussion_phase_id = ForeignId(
        DiscussionPhase,
        nullable = False,
    )
    instructions_section_title_id = LangStringId()
    instructions_section_content_id = LangStringId()
    propositions_section_title_id = LangStringId()
    
    discussion_phase = relationship(
        DiscussionPhase,
        backref=backref("vote_session", single_parent = True, cascade = "all, delete-orphan"),
    )
    instructions_section_title = langstring_relationship(__tablename__, instructions_section_title_id, 'instructions_section_title')
    instructions_section_content = langstring_relationship(__tablename__, instructions_section_content_id, 'instructions_section_content')
    propositions_section_title = langstring_relationship(__tablename__, propositions_section_title_id, 'propositions_section_title')
    
    def get_discussion_id(self):
        return self.discussion_phase.discussion_id

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return (cls.discussion_phase.discussion_id == discussion_id,)
        
LangString.setup_ownership_load_event(VoteSession, ['instructions_section_title', 'instructions_section_content', 'propositions_section_title'])