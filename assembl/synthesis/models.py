from datetime import datetime

from sqlalchemy.orm import relationship, backref, aliased
from sqlalchemy.sql import func, cast, select

from sqlalchemy import (
    Table,
    Column, 
    Boolean,
    Integer, 
    String,
    Float,
    Unicode, 
    UnicodeText, 
    DateTime,
    ForeignKey,
    desc,
    event,
)

from assembl.lib.utils import slugify

from ..db import DBSession
from ..lib.sqla import Base as SQLAlchemyBaseModel
from ..lib.types import UUID
from ..source.models import (Source, Content, Post)

class Discussion(SQLAlchemyBaseModel):
    """
    A Discussion
    """
    __tablename__ = "discussion"

    id = Column(Integer, primary_key=True)

    topic = Column(Unicode(255), nullable=False)
    
    slug = Column(Unicode, nullable=False, unique=True, index=True)
    
    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    table_of_contents_id = Column(
        Integer,
        ForeignKey('table_of_contents.id', ondelete="CASCADE"),
        nullable=False,
    )

    table_of_contents = relationship(
        'TableOfContents', 
        uselist=False,
    )

    owner_id = Column(
        Integer,
        ForeignKey('user.id'),
        nullable=False
    )

    owner = relationship(
        'User',
        backref="discussions"
    )

    def posts(self, parent_id=None):
        """
        Returns an iterable query of posts whose content comes from a source
        that belongs to this topic. The result is a list of posts sorted by
        their youngest descendent in descending order.
        """
        lower_post = aliased(Post, name="lower_post")
        lower_content = aliased(Content, name="lower_content")
        upper_post = aliased(Post, name="upper_post")
        upper_content = aliased(Content, name="upper_content")

        latest_update = select([
            func.coalesce(
                func.max(lower_content.creation_date),
                upper_content.creation_date
            )
        ], lower_post.content_id==lower_content.id).where(
            lower_post.ancestry.like(
                upper_post.ancestry + cast(upper_post.id, String) + ',%'
            )
        ).label("latest_update")

        query = DBSession.query(
            upper_post,
        ).join(
            upper_content,
        ).filter(
            upper_post.parent_id==parent_id
        ).order_by(
            desc(latest_update)
        )

        if not parent_id:
            query = query.join(
                Source
            ).filter(
                Source.discussion_id==self.id,
                upper_content.source_id==Source.id,
            )

        return query

    def total_posts(self):
        return DBSession.query(Post).join(
            Content,
            Source
        ).filter(
            Source.discussion_id==self.id,
            Content.source_id==Source.id,
        ).count()

    def import_from_sources(self, only_new=True):
        for source in self.sources:
            source.import_content(only_new=only_new)

    def __init__(self, *args, **kwargs):
        super(Discussion, self).__init__(*args, **kwargs)
        self.table_of_contents = TableOfContents(discussion=self)

    def __repr__(self):
        return "<Discussion %s>" % repr(self.topic)


def slugify_topic_if_slug_is_empty(discussion, topic, oldvalue, initiator):
    """
    if the target doesn't have a slug, slugify the topic and use that.
    """
    if not discussion.slug:
        discussion.slug = slugify(topic)


event.listen(Discussion.topic, 'set', slugify_topic_if_slug_is_empty)


class TableOfContents(SQLAlchemyBaseModel):
    """
    Represents a Table of Contents.

    A ToC in Assembl is used to organize the core ideas of a discussion in a
    threaded hierarchy.
    """
    __tablename__ = "table_of_contents"

    id = Column(Integer, primary_key=True)
    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)

    discussion = relationship(
        'Discussion',
        uselist=False
    )

    def __repr__(self):
        return "<TableOfContents %s>" % repr(self.discussion.topic)

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
            return "<Idea %d %s>" % (self.id, repr(self.short_title))

        return "<Idea %d>" % self.id


class Extract(SQLAlchemyBaseModel):
    """
    An extracted part. A quotation to be referenced by an `Idea`.
    """
    __tablename__ = 'extract'

    id = Column(Integer, primary_key=True)
    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    order = Column(Float, nullable=False, default=0.0)
    body = Column(UnicodeText, nullable=False)

    source_id = Column(Integer, ForeignKey('content.id'), nullable=False)
    source = relationship(Content, backref='extracts')

    idea_id = Column(Integer, ForeignKey('idea.id'), nullable=True)
    idea = relationship('Idea', backref='extracts')

    creator_id = Column(
        Integer,
        ForeignKey('user.id'),
        nullable=False,
    )

    creator = relationship(
        'User', foreign_keys=[creator_id], backref='extracts_created')

    owner_id = Column(
        Integer,
        ForeignKey('user.id'),
        nullable=False,
    )

    owner = relationship(
        'User', foreign_keys=[owner_id], backref='extracts_owned')

    def __repr__(self):
        return "<Extract %d %s>" % (self.id, repr(self.body[:20]))
