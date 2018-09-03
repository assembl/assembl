from sqlalchemy.orm import relationship, backref
from sqlalchemy import (
    Column,
    Integer,
    UnicodeText,
    ForeignKey
)

from ..auth import CrudPermissions, P_ADMIN_DISC, P_READ
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

    video_title_id = Column(
        Integer(), ForeignKey(LangString.id))

    video_description_top_id = Column(
        Integer(), ForeignKey(LangString.id))

    video_description_bottom_id = Column(
        Integer(), ForeignKey(LangString.id))

    video_description_side_id = Column(
        Integer(), ForeignKey(LangString.id))

    video_title = relationship(
        LangString,
        lazy="joined", single_parent=True,
        primaryjoin=video_title_id == LangString.id,
        backref=backref("title_of_video", lazy="dynamic"),
        cascade="all, delete-orphan")

    video_description_top = relationship(
        LangString,
        lazy="joined", single_parent=True,
        primaryjoin=video_description_top_id == LangString.id,
        backref=backref("description_of_video_top", lazy="dynamic"),
        cascade="all, delete-orphan")

    video_description_bottom = relationship(
        LangString,
        lazy="joined", single_parent=True,
        primaryjoin=video_description_bottom_id == LangString.id,
        backref=backref("description_of_video_bottom", lazy="dynamic"),
        cascade="all, delete-orphan")

    video_description_side = relationship(
        LangString,
        lazy="joined", single_parent=True,
        primaryjoin=video_description_side_id == LangString.id,
        backref=backref("description_of_video_side", lazy="dynamic"),
        cascade="all, delete-orphan")

    video_html_code = Column(UnicodeText)

    crud_permissions = CrudPermissions(P_ADMIN_DISC, P_READ, P_ADMIN_DISC, P_ADMIN_DISC)


LangString.setup_ownership_load_event(
    Thematic, ['video_title', 'video_description_top', 'video_description_bottom', 'video_description_side'])


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

    crud_permissions = CrudPermissions(P_ADMIN_DISC, P_READ, P_ADMIN_DISC, P_ADMIN_DISC)
