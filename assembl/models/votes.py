from abc import abstractproperty
from datetime import datetime
import simplejson as json

from sqlalchemy import (
    Column, Integer, ForeignKey, Boolean, String, Float, DateTime, Text, and_)
from sqlalchemy.orm import relationship, backref
from pyramid.settings import asbool

from . import (Base, DiscussionBoundBase, HistoryMixin)
from ..lib.abc import abstractclassmethod
from .discussion import Discussion
from .idea import Idea
from .auth import User
from ..auth import CrudPermissions, P_VOTE, P_SYSADMIN, P_ADMIN_DISC, P_READ
from .widgets import MultiCriterionVotingWidget
from ..semantic.virtuoso_mapping import QuadMapPatternS
from ..semantic.namespaces import (VOTE, ASSEMBL, DCTERMS)


class AbstractVoteSpecification(DiscussionBoundBase):
    """The representation of a way to vote on an idea.
    There can be more than one VoteSpecification in a Question,
    as in the case of a 2-D widget."""

    __tablename__ = "vote_specification"

    id = Column(Integer, primary_key=True)

    type = Column(String(60), nullable=False)
    __mapper_args__ = {
        'polymorphic_identity': 'abstract_vote_specification',
        'polymorphic_on': 'type',
        'with_polymorphic': '*'
    }

    widget_id = Column(Integer, ForeignKey(
        MultiCriterionVotingWidget.id), nullable=False)
    "Used by a voting widget"

    criterion_idea_id = Column(Integer, ForeignKey(
        Idea.id), nullable=True)
    "Optional: the specification may be tied to an idea"

    question_id = Column(Integer, nullable=False)
    "Group vote specifications in questions."
    "The question is a front-end object."

    settings = Column(Text)  # JSON blob

    widget = relationship(
        MultiCriterionVotingWidget, backref="vote_specifications")
    criterion_idea = relationship(
        Idea, backref="criterion_for")

    @abstractclassmethod
    def get_vote_class(cls):
        pass

    def is_valid_vote(self, vote):
        if not issubclass(vote.__class__, self.get_vote_class()):
            return False

    @property
    def settings_json(self):
        if self.settings:
            return json.loads(self.settings)
        return {}

    @settings_json.setter
    def settings_json(self, val):
        self.settings = json.dumps(val)

    def get_discussion_id(self):
        return self.widget.discussion_id

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return ((cls.widget_id == MultiCriterionVotingWidget.id),
                (MultiCriterionVotingWidget.discussion_id == discussion_id))

    crud_permissions = CrudPermissions(P_ADMIN_DISC, P_READ)


class LickertVoteSpecification(AbstractVoteSpecification):
    __tablename__ = "lickert_vote_specification"
    rdf_class = VOTE.LickertRange
    __mapper_args__ = {
        'polymorphic_identity': 'lickert_vote_specification'
    }

    id = Column(
        Integer, ForeignKey(AbstractVoteSpecification.id), primary_key=True)

    minimum = Column(Integer, default=1,
                     info={'rdf': QuadMapPatternS(None, VOTE.min)})
    maximum = Column(Integer, default=10,
                     info={'rdf': QuadMapPatternS(None, VOTE.max)})

    def get_vote_class(cls):
        return LickertIdeaVote

    def is_valid_vote(self, vote):
        if not super(LickertVoteSpecification, self).is_valid_vote(vote):
            return False
        return self.min <= vote.vote_value <= vote.max


class BinaryVoteSpecification(AbstractVoteSpecification):
    __mapper_args__ = {
        'polymorphic_identity': 'binary_vote_specification'
    }

    def get_vote_class(cls):
        return BinaryIdeaVote


class MultipleChoiceVoteSpecification(AbstractVoteSpecification):
    __tablename__ = "multiple_choice_vote_specification"
    __mapper_args__ = {
        'polymorphic_identity': 'multiple_choice_vote_specification'
    }

    id = Column(
        Integer, ForeignKey(AbstractVoteSpecification.id), primary_key=True)

    num_choices = Column(Integer, nullable=False)

    def get_vote_class(cls):
        return MultipleChoiceIdeaVote


class AbstractIdeaVote(DiscussionBoundBase, HistoryMixin):
    __tablename__ = "idea_vote"

    type = Column(String(60), nullable=False)

    __mapper_args__ = {
        'polymorphic_identity': 'idea_graph_view',
        'polymorphic_on': 'type',
        'with_polymorphic': '*'
    }

    idea_id = Column(
        Integer,
        ForeignKey(Idea.id, ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
        info={'rdf': QuadMapPatternS(None, VOTE.subject_node)}
    )
    idea_ts = relationship(
        Idea, foreign_keys=(idea_id,))
    idea = relationship(
        Idea,
        primaryjoin=and_(Idea.id == idea_id,
                         Idea.tombstone_date == None),
        foreign_keys=(idea_id,),
        backref=backref("votes", cascade="all, delete-orphan"))

    vote_spec_id = Column(
        Integer,
        ForeignKey(AbstractVoteSpecification.id,
                   ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False
    )
    vote_spec_ts = relationship(AbstractVoteSpecification)

    criterion_id = Column(
        Integer,
        ForeignKey(Idea.id, ondelete="CASCADE", onupdate="CASCADE"),
        nullable=True,
        info={'rdf': QuadMapPatternS(None, VOTE.voting_criterion)}
    )

    # This dies and becomes indirect through vote_spec
    criterion_ts = relationship(
        Idea, foreign_keys=(criterion_id,))
    criterion = relationship(
        Idea,
        primaryjoin=and_(Idea.id == criterion_id,
                         Idea.tombstone_date == None),
        foreign_keys=(criterion_id,),
        backref="votes_using_this_criterion")

    vote_date = Column(DateTime, default=datetime.utcnow,
                       info={'rdf': QuadMapPatternS(None, DCTERMS.created)})

    voter_id = Column(
        Integer,
        ForeignKey(User.id, ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
        info={'rdf': QuadMapPatternS(None, VOTE.voter)}
    )
    voter = relationship(
        User, backref=backref("votes", cascade="all, delete-orphan"))

    def is_owner(self, user_id):
        return self.voter_id == user_id

    @classmethod
    def restrict_to_owners(cls, query, user_id):
        "filter query according to object owners"
        return query.filter(cls.voter_id == user_id)

    # Do we still need this? Can access through vote_spec
    widget_id = Column(
        Integer,
        ForeignKey(MultiCriterionVotingWidget.id,
                   ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False)
    widget = relationship(
        MultiCriterionVotingWidget,
        primaryjoin="and_(MultiCriterionVotingWidget.id==AbstractIdeaVote.widget_id, "
                         "AbstractIdeaVote.tombstone_date == None)",
        backref=backref("votes", cascade="all, delete-orphan"))

    def get_discussion_id(self):
        return self.idea_ts.discussion_id

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return ((cls.idea_id == Idea.id),
                (Idea.discussion_id == discussion_id))

    discussion = relationship(
        Discussion, viewonly=True, uselist=False,
        secondary=Idea.__table__, primaryjoin=(idea_id == Idea.id),
        info={'rdf': QuadMapPatternS(None, ASSEMBL.in_conversation)})

    @classmethod
    def external_typename(cls):
        return "IdeaVote"

    @abstractproperty
    def value(self):
        pass

    def copy(self, tombstone=None, **kwargs):
        kwargs.update(
            tombstone=tombstone,
            widget=self.widget,
            discussion=self.discussion,
            voter=self.voter,
            idea=self.idea,
            criterion=self.criterion,
            vote_date=self.vote_date,
        )
        return super(AbstractIdeaVote, self).copy(**kwargs)

    def unique_query(self):
        idea_id = self.idea_id or (self.idea.id if self.idea else None)
        widget_id = self.widget_id or (self.widget.id if self.widget else None)
        voter_id = self.voter_id or (self.voter.id if self.voter else None)
        return (self.db.query(self.__class__).filter_by(
                    idea_id=idea_id, widget_id=widget_id, voter_id=voter_id), True)

    crud_permissions = CrudPermissions(
        P_VOTE, P_ADMIN_DISC, P_SYSADMIN, P_SYSADMIN, P_VOTE, P_VOTE, P_READ)


AbstractIdeaVote.vote_spec = relationship(
    AbstractVoteSpecification,
    primaryjoin=and_(
        AbstractVoteSpecification.id == AbstractIdeaVote.vote_spec_id,
        AbstractIdeaVote.tombstone_date == None),
    backref="votes")


class LickertRange(Base):
    __tablename__ = "lickert_range"
    rdf_class = VOTE.LickertRange

    id = Column(Integer, primary_key=True,
                info={'rdf': QuadMapPatternS(None, ASSEMBL.db_id)})

    minimum = Column(Integer,
                     info={'rdf': QuadMapPatternS(None, VOTE.min)})

    maximum = Column(Integer,
                     info={'rdf': QuadMapPatternS(None, VOTE.max)})

    @classmethod
    def get_range(cls, max=10, min=1):
        range = cls.default_db.query(cls).filter_by(minimum=min, maximum=max).first()
        if not range:
            range = cls(minimum=min, maximum=max)
            cls.default_db.add(range)
        return range


class LickertIdeaVote(AbstractIdeaVote):
    __tablename__ = "lickert_idea_vote"
    __table_args__ = ()
    rdf_class = VOTE.LickertVote
    __mapper_args__ = {
        'polymorphic_identity': 'lickert_idea_vote',
    }
    id = Column(Integer, ForeignKey(
        AbstractIdeaVote.id,
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    range_id = Column(
        Integer,
        ForeignKey(LickertRange.id, ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
        info={'rdf': QuadMapPatternS(None, VOTE.lickert_in_range)}
    )
    lickert_range = relationship(LickertRange)

    vote_value = Column(
        Float, nullable=False,
        info={'rdf': QuadMapPatternS(None, VOTE.lickert_value)})

    def __init__(self, **kwargs):
        if not ('lickert_range' in kwargs or 'range_id' in kwargs):
            kwargs['lickert_range'] = LickertRange.get_range()
        if 'value' in kwargs:
            # make sure lickert comes first
            if 'range_id' in kwargs:
                self.lickert_range = LickertRange.get_instance(
                    kwargs['range_id'])
            elif 'lickert_range' in kwargs:
                self.lickert_range = kwargs['lickert_range']
        super(LickertIdeaVote, self).__init__(**kwargs)

    @classmethod
    def external_typename(cls):
        return cls.__name__

    @property
    def value(self):
        return self.vote_value

    def copy(self, tombstone=None, **kwargs):
        kwargs.update(
            tombstone=tombstone,
            lickert_range=self.lickert_range,
            vote_value=self.vote_value
        )
        return super(LickertIdeaVote, self).copy(**kwargs)

    @value.setter
    def value(self, val):
        val = float(val)
        # assert val <= self.lickert_range.maximum and \
        #     val >= self.lickert_range.minimum
        self.vote_value = val


class MultipleChoiceIdeaVote(AbstractIdeaVote):
    __tablename__ = "multiple_choice_idea_vote"
    __table_args__ = ()
    __mapper_args__ = {
        'polymorphic_identity': 'multiple_choice_idea_vote',
    }

    id = Column(Integer, ForeignKey(
        AbstractIdeaVote.id,
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    vote_value = Column(
        Integer, nullable=False)


class BinaryIdeaVote(AbstractIdeaVote):
    rdf_class = VOTE.BinaryVote
    __tablename__ = "binary_idea_vote"
    __table_args__ = ()
    __mapper_args__ = {
        'polymorphic_identity': 'binary_idea_vote',
    }

    id = Column(Integer, ForeignKey(
        AbstractIdeaVote.id,
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    vote_value = Column(
        Boolean, nullable=False,
        info={'rdf': QuadMapPatternS(None, VOTE.positive)})

    @classmethod
    def external_typename(cls):
        return cls.__name__

    @property
    def safe_value(self):
        return self.value

    @safe_value.setter
    def safe_value(self, val):
        assert self.lickert_range.minimum <= val <= self.lickert_range.maximum
        self.value = val

    @property
    def value(self):
        return self.vote_value

    @value.setter
    def value(self, val):
        self.vote_value = asbool(val)

    def copy(self, tombstone=None, **kwargs):
        kwargs.update(
            tombstone=tombstone,
            vote_value=self.vote_value
        )
        return super(BinaryIdeaVote, self).copy(**kwargs)
