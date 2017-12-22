from .timeline import DiscussionPhase
from .langstrings_helpers import declareLangStrings


class VoteSession(DiscussionPhase):
    """ A vote session phase.
        Uses DiscussionPhase.description as frontend subtitle. """
    __tablename__ = "vote_session"


declareLangStrings(VoteSession, [
    'instructions_section_title',
    'propositions_section_title'
])
