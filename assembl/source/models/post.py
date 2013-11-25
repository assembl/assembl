from datetime import datetime

from sqlalchemy.orm import relationship, backref, aliased
from sqlalchemy.sql import func

from sqlalchemy import (
    Column,
    Integer,
    DateTime,
    String,
    ForeignKey,
    Boolean,
    or_,
)

from assembl.lib.sqla import Base as SQLAlchemyBaseModel
from assembl.source.models.generic import Content
from assembl.auth.models import AgentProfile


class Post(SQLAlchemyBaseModel):
    """
    A Post represents input into the broader discussion taking place on
    Assembl. It may be a response to another post, it may have responses, and
    its content may be of any type.
    """
    __tablename__ = "post"

    id = Column(Integer, primary_key=True)
    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    is_synthesis = Column(Boolean, default=False)
    ancestry = Column(String, default="")

    content_id = Column(Integer, ForeignKey('content.id', ondelete='CASCADE'))

    parent_id = Column(Integer, ForeignKey('post.id'))
    children = relationship(
        "Post",
        backref=backref('parent', remote_side=[id])
    )

    creator_id = Column(Integer, ForeignKey('agent_profile.id'))
    creator = relationship(AgentProfile)

    def get_descendants(self):
        ancestry_query_string = "%s%d,%%" % (self.ancestry or '', self.id)

        descendants = self.db.query(Post).join(Content).filter(
            Post.ancestry.like(ancestry_query_string)
        ).order_by(Content.creation_date)

        return descendants

    def set_ancestry(self, new_ancestry):
        descendants = self.get_descendants()
        old_ancestry = self.ancestry or ''
        self.ancestry = new_ancestry
        self.db.add(self)

        for descendant in descendants:
            updated_ancestry = descendant.ancestry.replace(
                "%s%d," % (old_ancestry, self.id),
                "%s%d," % (new_ancestry, self.id),
                1
            )

            descendant.ancestry = updated_ancestry
            self.db.add(descendant)
            
    def set_parent(self, parent):
        self.parent = parent
        self.db.add(self)
        self.db.add(parent)

        self.set_ancestry("%s%d," % (
            parent.ancestry or '',
            parent.id
        ))

    def last_updated(self):
        ancestry_query_string = "%s%d,%%" % (self.ancestry or '', self.id)
        
        query = self.db.query(
            func.max(Content.creation_date)
        ).select_from(
            Post
        ).join(
            Content
        ).filter(
            or_(Post.ancestry.like(ancestry_query_string), Post.id == self.id)
        )

        return query.scalar()

    def ancestors(self):
        ancestor_ids = [
            ancestor_id \
            for ancestor_id \
            in self.ancestry.split(',') \
            if ancestor_id
        ]

        ancestors = [
            Post.get(id=ancestor_id) \
            for ancestor_id \
            in ancestor_ids
        ]

        return ancestors

    def get_discussion_id(self):
        if self.content:
            return self.content.get_discussion_id()
        elif self.content_id:
            return Content.get(id=self.content_id).get_discussion_id()

    def __repr__(self):
        return "<Post %d '%s %d'>" % (
            self.id,
            self.content.type,
            self.content.id,
        )

