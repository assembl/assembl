from datetime import datetime

from sqlalchemy.orm import relationship, backref, aliased
from sqlalchemy.sql import func, cast

from sqlalchemy import (
    Column, 
    Boolean,
    Integer, 
    Unicode, 
    UnicodeText, 
    DateTime,
    ForeignKey,
    desc
)

from ..db import DBSession
from ..db.models import SQLAlchemyBaseModel
from ..source.models import *



class Discussion(SQLAlchemyBaseModel):
    """
    A Discussion
    """
    __tablename__ = "discussion"

    id = Column(
        Integer, 
        ForeignKey('restricted_access_model.id', ondelete='CASCADE'),
        primary_key=True
    )

    topic = Column(Unicode(255), nullable=False)

    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)

    table_of_contents = relationship(
        'TableOfContents', 
        uselist=False,
        backref='discussion'
    )
    
    __mapper_args__ = {
        'polymorphic_identity': 'discussion',
    }

    def root_posts(self, limit=15, offset=None):
        """
        Queries posts whose content comes from a source that belongs to this
        topic. The result is a list of posts sorted by their youngest
        descendent in descending order.
        """
        upper_post = aliased(Post, name="upper_post")
        descendants = DBSession.query(
            Post,
            func.max(Content.creation_date).label('last_update')
        ).join(
            Content
        ).filter(
            Post.ancestry.like(
                upper_post.ancestry + cast(upper_post.id, String) + ',%'
            )
        ).subquery()

        query = DBSession.query(
            upper_post,
            descendants.c.last_update
        ).join(
            'content',
            'source',
            'discussion',
        ).filter(
            Source.discussion_id==self.id,
            Content.source_id==Source.id,
            Post.content_id==Content.id,
            upper_post.parent_id==None
        ).order_by(descendants.c.last_update, Content.creation_date)

        if limit:
            query = query.limit(int(limit))

        if offset:
            query = query.offset(int(offset))

        posts_with_last_update_time = query.all()

        return posts_with_last_update_time

    def __init__(self, *args, **kwargs):
        super(Discussion, self).__init__(*args, **kwargs)
        self.table_of_contents = TableOfContents(discussion=self)

    def __repr__(self):
        return "<Discussion '%s'>" % self.topic


class TableOfContents(SQLAlchemyBaseModel):
    """
    Represents a Table of Contents.

    A ToC in Assembl is used to organize the core ideas of a discussion in a
    threaded hierarchy.
    """
    __tablename__ = "table_of_contents"

    id = Column(Integer, primary_key=True)
    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)

    discussion_id = Column(
        Integer,
        ForeignKey('discussion.id')
    )

    def __repr__(self):
        return "<TableOfContents '%s'>" % self.discussion.topic
