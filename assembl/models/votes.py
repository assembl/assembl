from abc import abstractproperty

from sqlalchemy import (
    Column, Integer, ForeignKey, Boolean, String)
from sqlalchemy.orm import relationship

from . import (Base, DiscussionBoundBase, Idea, User)
from ..semantic.virtuoso_mapping import QuadMapPatternS
from ..semantic.namespaces import (VOTE, ASSEMBL)


class AbstractIdeaVote(DiscussionBoundBase):
    __tablename__ = "idea_vote"

    id = Column(Integer, primary_key=True,
                info={'rdf': QuadMapPatternS(None, ASSEMBL.db_id)})

    type = Column(String(60), nullable=False)

    __mapper_args__ = {
        'polymorphic_identity': 'idea_graph_view',
        'polymorphic_on': 'type',
        'with_polymorphic': '*'
    }

    idea_id = Column(
        Integer,
        ForeignKey('idea.id', ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
        info={'rdf': QuadMapPatternS(None, VOTE.subject_node)}
    )
    idea = relationship(Idea, backref="votes")

    voter_id = Column(
        Integer,
        ForeignKey(User.id, ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
        info={'rdf': QuadMapPatternS(None, VOTE.voter)}
    )
    voter = relationship(User, backref="votes")

    def get_discussion_id(self):
        return self.idea.discussion_id

    @classmethod
    def get_discussion_condition(cls, discussion_id):
        return (cls.idea_id == Idea.id) & \
            (Idea.discussion_id == discussion_id)

    @classmethod
    def external_typename(cls):
        return "IdeaVote"

    @abstractproperty
    def value(self):
        pass


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
        range = cls.db.query(cls).filter_by(minimum=min, maximum=max).first()
        if not range:
            range = cls(minimum=min, maximum=max)
            cls.db.add(range)
        return range


class LickertIdeaVote(AbstractIdeaVote):
    __tablename__ = "lickert_idea_vote"
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
        Integer, nullable=False,
        info={'rdf': QuadMapPatternS(None, VOTE.lickert_value)})

    @classmethod
    def external_typename(cls):
        return cls.__name__

    @property
    def value(self):
        return self.vote_value

    @value.setter
    def value(self, val):
        assert val <= self.lickert_range.maximum and \
            val >= self.lickert_range.minimum
        self.vote_value = val


class BinaryIdeaVote(AbstractIdeaVote):
    rdf_class = VOTE.BinaryVote
    __tablename__ = "binary_idea_vote"
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
    def set_value_safe(self, val):
        assert val <= self.lickert_range.maximum and \
            val >= self.lickert_range.minimum
        self.value = val

    @property
    def value(self):
        return self.vote_value

    @value.setter
    def value_safe(self, val):
        self.vote_value = val
