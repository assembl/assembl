from datetime import datetime

from sqlalchemy.orm import relationship, backref
from sqlalchemy import (
    Column,
    Integer,
    UnicodeText,
    String,
    DateTime,
    ForeignKey,
)

from assembl.lib.sqla import Base as SQLAlchemyBaseModel

class ContentSource(SQLAlchemyBaseModel):
    """
    A ContentSource is where any outside content comes from. .
    """
    __tablename__ = "content_source"

    id = Column(Integer, primary_key=True)
    name = Column(UnicodeText, nullable=False)
    type = Column(String(60), nullable=False)

    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)

    __mapper_args__ = {
        'polymorphic_identity': 'content_source',
        'polymorphic_on': type
    }

    def serializable(self):
        from assembl.models import Discussion
        return {
            "@id": self.uri_generic(self.id),
            "@type": self.external_typename(),
            "name": self.name,
            "creation_date": self.creation_date.isoformat(),
            "last_import": self.last_import.isoformat() if self.last_import else None,
            "discussion_id": Discussion.uri_generic(self.discussion_id),
        }

    def __repr__(self):
        return "<ContentSource %s>" % repr(self.name)

    def import_content(self, only_new=True):
        pass

    def get_discussion_id(self):
        return self.discussion_id



class PostSource(ContentSource):
    """
    A Discussion PostSource is where commentary that is handled in the form of
    Assembl posts comes from. 

    A discussion source should have a method for importing all content, as well
    as only importing new content. Maybe the standard interface for this should
    be `source.import()`.
    """
    __tablename__ = "post_source"

    id = Column(Integer, ForeignKey(
        'content_source.id',
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    last_import = Column(DateTime)

    discussion_id = Column(Integer, ForeignKey(
        'discussion.id', 
        ondelete='CASCADE',
        onupdate='CASCADE'
    ))

    discussion = relationship(
        "Discussion", 
        backref=backref('sources', order_by=ContentSource.creation_date)
    )

    __mapper_args__ = {
        'polymorphic_identity': 'content_source',
    }

    def serializable(self):
        from assembl.models import Discussion
        return {
            "@id": self.uri_generic(self.id),
            "@type": self.external_typename(),
            "name": self.name,
            "creation_date": self.creation_date.isoformat(),
            "last_import": self.last_import.isoformat() if self.last_import else None,
            "discussion_id": Discussion.uri_generic(self.discussion_id),
        }

    def __repr__(self):
        return "<PostSource %s>" % repr(self.name)

    def import_content(self, only_new=True):
        pass

    def get_discussion_id(self):
        return self.discussion_id

    def send_post(self, post):
        """ Send a new post in the discussion to the source. """
        raise "Source %s did not implement PostSource::send_post() " % self.__class__.__name__

class AnnotatorSource(ContentSource):
    """
    A source of content coming from annotator
    """
    __tablename__ = "annotator_source"

    id = Column(Integer, ForeignKey(
        'content_source.id',
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    __mapper_args__ = {
        'polymorphic_identity': 'annotator_source',
    }



class Content(SQLAlchemyBaseModel):
    """
    Content is a polymorphic class to describe what is imported from a Source.
    """
    __tablename__ = "content"

    id = Column(Integer, primary_key=True)
    type = Column(String(60), nullable=False)
    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    import_date = Column(DateTime, default=datetime.utcnow)

    __mapper_args__ = {
        'polymorphic_identity': 'content',
        'polymorphic_on': 'type',
        'with_polymorphic':'*'
    }

    def __init__(self, *args, **kwargs):
        super(Content, self).__init__(*args, **kwargs)

    def __repr__(self):
        return "<Content %s>" % repr(self.type)

    def get_body(self):
        return ""

    def get_title(self):
        return ""

    def get_discussion_id(self):
        if self.source:
            return self.source.get_discussion_id()
        elif self.source_id:
            return PostSource.get(id=self.source_id).get_discussion_id()
