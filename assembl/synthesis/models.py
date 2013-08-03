from datetime import datetime

from sqlalchemy.orm import relationship, backref, aliased
from sqlalchemy.sql import func, cast, select

from sqlalchemy import (
    Table,
    Column, 
    Boolean,
    Integer, 
    Float,
    Unicode, 
    UnicodeText, 
    DateTime,
    ForeignKey,
    desc
)

from ..db import DBSession
from ..db.models import SQLAlchemyBaseModel
from ..auth.models import RestrictedAccessModel
#from ..source.models import *



class Discussion(RestrictedAccessModel):
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
        ForeignKey('discussion.id'),
        nullable=False
    )

    def __repr__(self):
        return "<TableOfContents '%s'>" % self.discussion.topic

idea_association_table = Table(
    'idea_association',
    SQLAlchemyBaseModel.metadata,
    Column('parent_id', Integer, ForeignKey('idea.id')),
    Column('child_id', Integer, ForeignKey('idea.id')),
)

class Idea(SQLAlchemyBaseModel):
    """
    A core concept taken from the associated discussion
    """
    __tablename__ = "idea"

    long_title = Column(Unicode(255))
    short_title = Column(Unicode(255))

    id = Column(Integer, primary_key=True)
    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    order = Column(Float, nullable=False, default=0.0)

    table_of_contents_id = Column(
        Integer,
        ForeignKey('table_of_contents.id'),
        nullable=False
    )
    table_of_contents = relationship(
        'TableOfContents',
        backref='ideas',
    )

    children = relationship(
        "Idea",
        secondary='idea_association',
        backref="parents",
        primaryjoin=id==idea_association_table.c.parent_id,
        secondaryjoin=id==idea_association_table.c.child_id,
    )

    def __repr__(self):
        if self.short_title:
            return "<Idea %d '%s'>" % (self.id, self.short_title)

        return "<Idea %d>" % self.id

class Extract(SQLAlchemyBaseModel):
    """
    A part extracted from a Post.
    """
    __tablename__ = 'extract'

    id = Column(Integer, primary_key=True)
    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    order = Column(Float, nullable=False, default=0.0)
