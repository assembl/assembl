from . import Base

from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    UnicodeText,
    UniqueConstraint,
    func
)
from sqlalchemy.orm import relationship, backref

from assembl.auth import (
    CrudPermissions, P_ADD_POST, P_READ, P_EDIT_POST, P_ADMIN_DISC)


class AbstractTag(Base):
    """
    Represents a tag by a name and associated to one or multiple posts.
    """
    __tablename__ = 'abstract_tag'

    id = Column(Integer, primary_key=True)
    value = Column(UnicodeText, nullable=False, index=True)
    discussion_id = Column(Integer, ForeignKey(
        'discussion.id',
        ondelete='CASCADE',
        onupdate='CASCADE',
        ),
        nullable=False, index=True)
    discussion = relationship("Discussion")

    __table_args__ = (UniqueConstraint('value', 'discussion_id', name='unq_abstract_tag_value_discussion'), )
    __mapper_args__ = {
        'polymorphic_identity': 'abstract_tag',
        'with_polymorphic': '*'
    }

    # Same crud permissions as a post
    crud_permissions = CrudPermissions(
        P_ADD_POST, P_READ, P_EDIT_POST, P_ADMIN_DISC)

    def __repr__(self):
        return "<AbstractTag %s (%d)>" % (self.value, self.id or -1)

    def get_discussion_id(self):
        return self.discussion_id or self.discussion.id

    @classmethod
    def get_tag(cls, tag, discussion_id, db=None):
        db = db or cls.default_db
        tag_obj = db.query(cls).filter(
            func.lower(cls.value) == func.lower(tag),
            cls.discussion_id == discussion_id
        ).first()

        if not tag_obj:
            return cls(value=tag, discussion_id=discussion_id)

        return tag_obj


class TagOnPost(Base):
    __tablename__ = "tag_on_post"
    abstract_tag_id = Column(Integer, ForeignKey(
        'abstract_tag.id',
        ondelete='CASCADE',
        onupdate='CASCADE'
        ), primary_key=True)

    post_id = Column(Integer, ForeignKey(
        'post.id',
        ondelete='CASCADE',
        onupdate='CASCADE',
        ), primary_key=True)

    post = relationship(
        'Post',
        backref=backref(
            'abstract_tags',
            cascade="all, delete-orphan"),
    )

    abstract_tag = relationship(
        AbstractTag,
        backref=backref(
            'posts',
            cascade="all, delete-orphan"),
    )

    __mapper_args__ = {
        'polymorphic_identity': 'tag_on_post',
        'with_polymorphic': '*'
    }

    def __repr__(self):
        return "<TagOnPost %d-%d>" % (self.abstract_tag_id, self.post_id)

    def get_id_as_str(self):
        return "%s-%s" % (self.abstract_tag_id, self.post_id)
