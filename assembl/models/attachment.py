from sqlalchemy import (
    Column,
    UniqueConstraint,
    Integer,
    UnicodeText,
    DateTime,
    String,
    ForeignKey,
    Binary,
    Text,
    or_,
    event,
    func
)

from .generic import Content
from virtuoso.alchemy import CoerceUnicode
from sqlalchemy.orm import relationship, backref, deferred

from datetime import datetime
from ..semantic.virtuoso_mapping import QuadMapPatternS
from ..semantic.namespaces import (
    SIOC, IDEA, ASSEMBL, DCTERMS, QUADNAMES, FOAF, RDF, VirtRDF)
from . import DiscussionBoundBase
from .post import Post
from .idea import Idea
from .auth import AgentProfile

class Document(DiscussionBoundBase):
    """
    Represents a Document or file, local to the database or (more typically)
    a remote document
    """
    __tablename__ = "document"
    id = Column(
        Integer, primary_key=True)
    """
    The cannonical identifier of this document.  If a URL, it's to be 
    interpreted as a purl
    """
    uri_id = Column(CoerceUnicode(514), unique=False, index=True) ## MAP:  Change to true once https://app.asana.com/0/51461630427071/52921943509398 is done
    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow,
        info={'rdf': QuadMapPatternS(None, DCTERMS.created)})
    discussion_id = Column(Integer, ForeignKey(
        'discussion.id',
        ondelete='CASCADE',
        onupdate='CASCADE',
        ),
        nullable=False,)

    discussion = relationship(
        "Discussion",
        backref=backref(
            'documents',
            cascade="all, delete-orphan"),
    )

    oembed_type = Column(CoerceUnicode(1024), server_default="")
    mime_type = Column(CoerceUnicode(1024), server_default="")
    #From metadata, not the user
    title = Column(CoerceUnicode(), server_default="",
       info={'rdf': QuadMapPatternS(None, DCTERMS.title)})
    #From metadata, not the user
    description = Column(
        UnicodeText,
        info={'rdf': QuadMapPatternS(None, DCTERMS.description)})
    #From metadata, not the user
    author_name = Column(
        UnicodeText)
    #From metadata, not the user
    author_url = Column(
        UnicodeText)
    #From metadata, not the user
    thumbnail_url = Column(
        UnicodeText)
    #From metadata, not the user
    site_name = Column(
        UnicodeText)

    __mapper_args__ = {
        'polymorphic_identity': 'document',
    }
    
    def get_discussion_id(self):
        return self.discussion_id or self.discussion.id

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return (cls.id == discussion_id,)

class Attachment(DiscussionBoundBase):
    """
    Represents a Document or file, local to the database or (more typically)
    a remote document
    """
    __tablename__ = "attachment"
    id = Column(
        Integer, primary_key=True)

    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow,
        info={'rdf': QuadMapPatternS(None, DCTERMS.created)})
    discussion_id = Column(Integer, ForeignKey(
        'discussion.id',
        ondelete='CASCADE',
        onupdate='CASCADE',
        ),
        nullable=False,)

    discussion = relationship(
        "Discussion",
        backref=backref(
            'attachments',
            cascade="all, delete-orphan"),
    )

    document_id = Column(Integer, ForeignKey(
        'document.id',
        ondelete='CASCADE',
        onupdate='CASCADE',
        ),
        nullable=False,)

    document = relationship(
        Document,
        backref=backref(
            'attachments'),
    )

    creator_id = Column(Integer, ForeignKey('agent_profile.id'), nullable=False)
    creator = relationship(AgentProfile)
    title = Column(CoerceUnicode(1024), server_default="",
       info={'rdf': QuadMapPatternS(None, DCTERMS.title)})
    description = Column(
        UnicodeText,
        info={'rdf': QuadMapPatternS(None, DCTERMS.description)})

    attachmentPurpose = Column(
        CoerceUnicode(256), nullable=False, index=True)

    __mapper_args__ = {
        'polymorphic_identity': 'attachment',
        'with_polymorphic': '*'
    }

    def get_discussion_id(self):
        return self.discussion_id or self.discussion.id

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return (cls.id == discussion_id,)

class PostAttachment(Attachment):
    __tablename__ = "post_attachment"
    id = Column(Integer, ForeignKey(
        'attachment.id',
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    post_id = Column(Integer, ForeignKey(
        'post.id',
        ondelete='CASCADE',
        onupdate='CASCADE',
        ),
        nullable=False,
        index=True)

    post = relationship(
        Post,
        backref=backref(
            'attachments',
            cascade="all, delete-orphan"),
    )


class IdeaAttachment(Attachment):
    __tablename__ = "idea_attachment"
    id = Column(Integer, ForeignKey(
        'attachment.id',
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    idea_id = Column(Integer, ForeignKey(
        'idea.id',
        ondelete='CASCADE',
        onupdate='CASCADE',
        ),
        nullable=False,
        index=True)

    idea = relationship(
        Idea,
        backref=backref(
            'attachments',
            cascade="all, delete-orphan"),
    )