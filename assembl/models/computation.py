from datetime import datetime

from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    SmallInteger,
    DateTime,
    String,
)
from sqlalchemy.orm import relationship, backref
from sqlalchemy.dialects.postgresql import ENUM, JSONB

from . import Base, DiscussionBoundBase


class ComputationProcess(Base):
    """The name of a process that performs computations"""
    __tablename__ = 'computation_process'
    id = Column(Integer, primary_key=True)
    name = Column(String)

    @classmethod
    def by_name(cls, name, db=None):
        db = db or cls.default_db
        process = db.query(cls).filter_by(name=name).first()
        if not process:
            process = ComputationProcess(name=name)
            db.add(process)
        return process


class Computation(DiscussionBoundBase):
    """A computation request with its lifecycle."""
    __tablename__ = 'computation'
    computation_status = ENUM(
        'pending', 'success', 'failure', name="computation_status")

    id = Column(Integer, primary_key=True)
    process_id = Column(Integer, ForeignKey(ComputationProcess.id))
    created = Column(DateTime, default=datetime.utcnow)
    target_type = Column(String(20))
    status = Column(computation_status, server_default="pending")
    retries = Column(SmallInteger)
    parameters = Column(JSONB)
    result = Column(JSONB)
    process = relationship(ComputationProcess)

    __mapper_args__ = {
        'polymorphic_identity': 'abstract',
        'polymorphic_on': target_type,
        'with_polymorphic': '*',
    }


class ComputationOnPost(Computation, DiscussionBoundBase):
    """A computation that is bound to a post"""
    __tablename__ = 'computation_on_post'
    id = Column(Integer, ForeignKey(Computation.id), primary_key=True)
    post_id = Column(Integer, ForeignKey("content.id"), index=True)
    post = relationship("Content", backref=backref("computations", cascade="all, delete-orphan"))
    __mapper_args__ = {
        'polymorphic_identity': 'post',
    }

    def get_discussion_id(self):
        return self.post.discussion_id

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        from .generic import Content
        if alias_maker is None:
            computation = cls
            post = Content
        else:
            computation = alias_maker.alias_from_class(cls)
            post = alias_maker.alias_from_relns(computation.post)
        return ((computation.post_id == post.id),
                (post.discussion_id == discussion_id))


class ComputationOnIdea(Computation, DiscussionBoundBase):
    """A computation that is bound to an idea"""
    __tablename__ = 'computation_on_idea'
    __mapper_args__ = {
        'polymorphic_identity': 'idea',
    }
    id = Column(Integer, ForeignKey(Computation.id), primary_key=True)
    idea_id = Column(Integer, ForeignKey("idea.id"), index=True)
    idea = relationship("Idea", backref=backref("computations", cascade="all, delete-orphan"))

    def get_discussion_id(self):
        return self.idea.discussion_id

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        from .idea import Idea
        if alias_maker is None:
            computation = cls
            idea = Idea
        else:
            computation = alias_maker.alias_from_class(cls)
            idea = alias_maker.alias_from_relns(computation.idea)
        return ((computation.idea_id == idea.id),
                (idea.discussion_id == discussion_id))
