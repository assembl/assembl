from datetime import datetime

from sqlalchemy.orm import relationship, backref, with_polymorphic
from sqlalchemy import (
    Boolean,
    Column,
    Integer,
    ForeignKey
)

from assembl.auth import CrudPermissions, P_READ, P_ADMIN_DISC
from .langstrings import LangString
from .langstrings_helpers import langstrings_base
# from .timeline import DiscussionPhase
from .widgets import VotingWidget
from .idea import Idea

langstrings_names = [
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

    idea_id = Column(Integer, ForeignKey(Idea.id, onupdate="CASCADE", ondelete='CASCADE'), nullable=False, unique=True)

    idea = relationship(Idea, backref=backref("vote_session", single_parent=True, uselist=False, cascade="all, delete-orphan"),)

    see_current_votes = Column(
        Boolean,
        nullable=False,
        server_default='0',
        default=False)

    @classmethod
    def filter_started(cls, query):
        return query
# cls.discussion_phase doesn't exist anymore
#        return query.join(cls.discussion_phase).filter(
#            (DiscussionPhase.start == None) | (DiscussionPhase.start <= datetime.utcnow()))  # noqa: E711

    @classmethod
    def test_active(cls):
        return ()
#        now = datetime.utcnow()
#        return ((DiscussionPhase.end == None) | (DiscussionPhase.end > now) & (DiscussionPhase.start == None) | (DiscussionPhase.start <= now))  # noqa: E711

    @classmethod
    def filter_active(cls, query):
        return query
#        return query.join(cls.discussion_phase).filter(cls.test_active())

    def vote_session_discussion_phase(self):
        return self.idea.get_associated_phase()

    def is_started(self):
        phase = self.vote_session_discussion_phase()
        if phase:
            return phase.start == None or phase.start <= datetime.utcnow()  # noqa: E711
        return False

    def is_ended(self):
        phase = self.vote_session_discussion_phase()
        if phase:
            return phase.end != None and phase.end < datetime.utcnow()  # noqa: E711
        return False

    def get_voter_ids_query(self, start=None, end=None):
        vote_specifications = []
        for proposal in self.idea.get_vote_proposals():
            vote_specifications.extend(proposal.criterion_for)
        from .votes import AbstractIdeaVote
        vote_class = with_polymorphic(AbstractIdeaVote, AbstractIdeaVote)
        query = self.db.query(vote_class.voter_id
            ).filter_by(tombstone_date=None
            ).filter(vote_class.vote_spec_id.in_(
                [vote_spec.id for vote_spec in vote_specifications])
            ).distinct()
        if start is not None:
            query = query.filter(vote_class.vote_date >= start)
        if end is not None:
            query = query.filter(vote_class.vote_date <= end)
        return query

    def get_num_votes(self, start=None, end=None):
        vote_specifications = []
        for proposal in self.idea.get_vote_proposals():
            vote_specifications.extend(proposal.criterion_for)
        from .votes import AbstractIdeaVote
        vote_class = with_polymorphic(AbstractIdeaVote, AbstractIdeaVote)
        query = self.db.query(vote_class.voter_id
            ).filter_by(tombstone_date=None
            ).filter(vote_class.vote_spec_id.in_(
                [vote_spec.id for vote_spec in vote_specifications])
            )
        if start is not None:
            query = query.filter(vote_class.vote_date >= start)
        if end is not None:
            query = query.filter(vote_class.vote_date <= end)
        # There is no distinct on purpose here.
        # For a token vote spec, voting on two categories is counted as 2 votes.
        return query.count()

    crud_permissions = CrudPermissions(
        create=P_ADMIN_DISC,
        read=P_READ,
        update=P_ADMIN_DISC,
        delete=P_ADMIN_DISC)


LangString.setup_ownership_load_event(VoteSession, langstrings_names)


class VoteProposal(Idea):
    """
    A vote proposal.
    """
    __mapper_args__ = {
        'polymorphic_identity': 'vote_proposal',
    }

    @classmethod
    def graphene_type(cls):
        return 'Idea'
