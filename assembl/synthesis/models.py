from datetime import datetime

from sqlalchemy.orm import relationship, backref, aliased
from sqlalchemy.sql import func, cast, select

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

    def posts(self, limit=15, offset=None, parent_id=None):
        lower_post = aliased(Post, name="lower_post")
        lower_content = aliased(Content, name="lower_content")
        upper_post = aliased(Post, name="upper_post")

        latest_update = select([
            func.max(Content.creation_date).label('last_update'),
        ], lower_post.content_id==lower_content.id).where(
            lower_post.ancestry.like(
                upper_post.ancestry + cast(upper_post.id, String) + ',%'
            )
        ).label("latest_update")

        query = DBSession.query(
            upper_post,
        ).join(
            Content,
        ).filter(
            upper_post.parent_id==parent_id
        )

        if not parent_id:
            query = query.join(
                Source
            ).filter(
                Source.discussion_id==self.id,
                Content.source_id==Source.id,
                Post.content_id==Content.id,
            )
            
        query = query.order_by(
            desc(latest_update),
            Content.creation_date.desc()
        )

        if limit:
            query = query.limit(limit)

        if offset:
            query = query.offset(offset)

        return query.all()

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
