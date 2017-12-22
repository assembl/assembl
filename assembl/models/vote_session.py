from sqlalchemy import (Column, Integer, ForeignKey)
from sqlalchemy.orm import (relationship, backref)

from .timeline import DiscussionSession
from ..auth import (CrudPermissions, P_READ, P_ADMIN_DISC)
from .langstrings import LangString


class VoteSession(DiscussionSession):
    __tablename__ = "vote_session"

    id = Column(Integer, primary_key=True)

    crud_permissions = CrudPermissions(
        create=P_ADMIN_DISC,
        read=P_READ,
        update=P_ADMIN_DISC,
        delete=P_ADMIN_DISC,
        read_owned=P_READ,
        update_owned=P_ADMIN_DISC,
        delete_owned=P_ADMIN_DISC,
    )

    title_id = Column(
        Integer(), ForeignKey(LangString.id))
    title = relationship(
        LangString,
        lazy="joined", single_parent=True,
        primaryjoin=title_id == LangString.id,
        backref=backref("vote_session_from_title", lazy="dynamic"),
        cascade="all, delete-orphan")

    subtitle_id = Column(
        Integer(), ForeignKey(LangString.id))
    subtitle = relationship(
        LangString,
        lazy="joined", single_parent=True,
        primaryjoin=subtitle_id == LangString.id,
        backref=backref("vote_session_from_subtitle", lazy="dynamic"),
        cascade="all, delete-orphan")

    instructions_section_title_id = Column(
        Integer(), ForeignKey(LangString.id))
    instructions_section_title = relationship(
        LangString,
        lazy="joined", single_parent=True,
        primaryjoin=instructions_section_title_id == LangString.id,
        backref=backref(
            "vote_session_from_instructions_section_title", lazy="dynamic"
        ),
        cascade="all, delete-orphan")

    propositions_section_title_id = Column(
        Integer(), ForeignKey(LangString.id))
    propositions_section_title = relationship(
        LangString,
        lazy="joined", single_parent=True,
        primaryjoin=propositions_section_title_id == LangString.id,
        backref=backref(
            "vote_session_from_propositions_section_title", lazy="dynamic"
        ),
        cascade="all, delete-orphan")

    discussion_id = Column(
        Integer,
        ForeignKey(
            'discussion.id',
            ondelete='CASCADE',
            onupdate='CASCADE'
        ),
        nullable=False,
        index=True,
    )

    discussion = relationship(
        "Discussion",
        backref=backref(
            'vote_sessions',
            cascade="all, delete-orphan"
        ),
    )

    def get_discussion_id(self):
        return self.discussion_id or self.discussion.id

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return (cls.discussion_id == discussion_id,)


LangString.setup_ownership_load_event(VoteSession, [
    'title',
    'subtitle',
    'instructions_section_title',
    'propositions_section_title'
])
