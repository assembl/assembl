from .timeline import TimelineEvent
from .langstrings_helpers import declareLangStrings
from .inheritance_helpers import IdColumn

class VoteSession(TimelineEvent):
    """ A vote session timeline event.
        Uses TimelineEvent.description as frontend subtitle. """
        
    __tablename__ = "vote_session"
    
    id = IdColumn(TimelineEvent)
    
    __mapper_args__ = {
        'polymorphic_identity': 'vote_session',
    }

declareLangStrings(VoteSession, [
    'instructions_section_title',
    'instructions_section_content',
    'propositions_section_title'
])
