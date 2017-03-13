from sqlalchemy.orm import (
    relationship, backref, aliased, contains_eager, joinedload, deferred,
    column_property, with_polymorphic)
from sqlalchemy import (
    Column,
    Boolean,
    Integer,
    String,
    Unicode,
    Float,
    UnicodeText,
    DateTime,
    ForeignKey,
    inspect,
    select,
    func,
)

from .idea import Idea
from .langstrings import LangString


class Thematic(Idea):
    """
    A thematic for phase 1.
    """
    __tablename__ = "thematic"
    __mapper_args__ = {
        'polymorphic_identity': 'thematic',
    }

    id = Column(Integer, ForeignKey(
        Idea.id,
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    title_id = Column(
        Integer(), ForeignKey(LangString.id), nullable=False)

    description_id = Column(
        Integer(), ForeignKey(LangString.id))

    title = relationship(
        LangString,
        lazy="joined", single_parent=True,
        primaryjoin=title_id == LangString.id,
        backref=backref("title_of_thematic", lazy="dynamic"),
        cascade="all, delete-orphan")

    description = relationship(
        LangString,
        lazy="joined", single_parent=True,
        primaryjoin=description_id == LangString.id,
        backref=backref("description_of_thematic", lazy="dynamic"),
        cascade="all, delete-orphan")

    video_title_id = Column(
        Integer(), ForeignKey(LangString.id))

    video_description_id = Column(
        Integer(), ForeignKey(LangString.id))

    video_title = relationship(
        LangString,
        lazy="joined", single_parent=True,
        primaryjoin=video_title_id == LangString.id,
        backref=backref("title_of_video", lazy="dynamic"),
        cascade="all, delete-orphan")

    video_description = relationship(
        LangString,
        lazy="joined", single_parent=True,
        primaryjoin=video_description_id == LangString.id,
        backref=backref("description_of_video", lazy="dynamic"),
        cascade="all, delete-orphan")

    video_html_code = Column(UnicodeText)


class Question(Idea):
    """
    A question in a thematic for phase 1.
    """
    __tablename__ = "question"
    __mapper_args__ = {
        'polymorphic_identity': 'question',
    }

    id = Column(Integer, ForeignKey(
        Idea.id,
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    title_id = Column(
        Integer(), ForeignKey(LangString.id), nullable=False)

    title = relationship(
        LangString,
        lazy="joined", single_parent=True,
        primaryjoin=title_id == LangString.id,
        backref=backref("title_of_thematic", lazy="dynamic"),
        cascade="all, delete-orphan")
