from datetime import datetime

from sqlalchemy.orm import relationship, backref, aliased
from sqlalchemy.sql import func

from sqlalchemy import (
    Column,
    Integer,
    DateTime,
    Text,
    ForeignKey,
    or_,
)

from assembl.db.models import SQLAlchemyBaseModel
from assembl.db import DBSession
from assembl.source.models.generic import Content


class Post(SQLAlchemyBaseModel):
    """
    A Post represents input into the broader discussion taking place on
    Assembl. It may be a response to another post, it may have responses, and
    its content may be of any type.
    """
    __tablename__ = "post"

    id = Column(Integer, primary_key=True)
    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)

    ancestry = Column(Text, default="")

    content_id = Column(Integer, ForeignKey('content.id', ondelete='CASCADE'))
    content = relationship('Content', uselist=False)

    parent_id = Column(Integer, ForeignKey('post.id'))
    children = relationship(
        "Post",
        backref=backref('parent', remote_side=[id])
    )

    def get_descendants(self, include_self=True):
        ancestry_query_string = "%s%d,%%" % (self.ancestry or '', self.id)

        filter = Post.ancestry.like(ancestry_query_string)
        
        if include_self:
            filter = filter | (Post.id == self.id)

        descendants = DBSession.query(Post).join(Content).filter(filter)

        return descendants.order_by(Content.creation_date)

        # return descendants

    def set_ancestry(self, new_ancestry):
        descendants = self.get_descendants()
        old_ancestry = self.ancestry or ''
        self.ancestry = new_ancestry
        DBSession.add(self)

        for descendant in descendants:
            updated_ancestry = descendant.ancestry.replace(
                "%s%d," % (old_ancestry, self.id),
                "%s%d," % (new_ancestry, self.id),
                1
            )

            descendant.ancestry = updated_ancestry
            DBSession.add(descendant)
            
    def set_parent(self, parent):
        self.parent = parent
        DBSession.add(self)
        DBSession.add(parent)

        self.set_ancestry("%s%d," % (
            parent.ancestry or '',
            parent.id
        ))

    def last_updated(self):
        ancestry_query_string = "%s%d,%%" % (self.ancestry or '', self.id)
        
        query = DBSession.query(
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
            DBSession.query(Post).get(ancestor_id) \
            for ancestor_id \
            in ancestor_ids
        ]

        return ancestors

    def __repr__(self):
        return "<Post %s '%s %s' >" % (
            self.id,
            self.content.type,
            self.content.id,
        )
