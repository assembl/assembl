from datetime import datetime
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql import func
from sqlalchemy import (
    Column,
    Integer,
    DateTime,
    String,
    ForeignKey,
    Unicode,
    UnicodeText,
    or_,
    event,
)

from ..lib.virtuoso_mapping import QuadMapPatternS
from .generic import Content, ContentSource
from .auth import AgentProfile
from ..namespaces import  SIOC, CATALYST, IDEA, ASSEMBL, DCTERMS, QUADNAMES

class Post(Content):
    """
    A Post represents input into the broader discussion taking place on
    Assembl. It may be a response to another post, it may have responses, and
    its content may be of any type.
    """
    __tablename__ = "post"

    id = Column(Integer, ForeignKey(
        'content.id',
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)
    
    message_id = Column(Unicode(),
                        nullable=False,
                        index=True,
                        doc="The email-compatible message-id for the post.",
                        info= {'rdf': QuadMapPatternS(None, SIOC.id)})

    ancestry = Column(String, default="")

    parent_id = Column(Integer, ForeignKey('post.id'))
    children = relationship(
        "Post",
        foreign_keys=[parent_id],
        backref=backref('parent', remote_side=[id]),
    )

    @classmethod
    def special_quad_patterns(cls, alias_manager):
        # Don't we need a recursive alias for this? It seems not.
        return [
            QuadMapPatternS(
                Post.iri_class().apply(cls.id),
                SIOC.reply_of,
                cls.iri_class().apply(cls.parent_id),
                name=QUADNAMES.post_parent,
                condition=(cls.parent_id != None)),
        ]

    creator_id = Column(Integer, ForeignKey('agent_profile.id'),
        info= {'rdf': QuadMapPatternS(None, SIOC.has_creator,
                    AgentProfile.iri_class().apply())})
    creator = relationship(AgentProfile, backref="posts_created")
    
    subject = Column(Unicode(), nullable=True,
        info= {'rdf': QuadMapPatternS(None, DCTERMS.title)})
    # TODO: check HTML or text? SIOC.content should be text.
    body = Column(UnicodeText, nullable=False,
        info= {'rdf': QuadMapPatternS(None, SIOC.content)})

    __mapper_args__ = {
        'polymorphic_identity': 'post',
    }
    
    def get_descendants(self):
        ancestry_query_string = "%s%d,%%" % (self.ancestry or '', self.id)

        descendants = self.db.query(Post).filter(
            Post.ancestry.like(ancestry_query_string)
        ).order_by(Content.creation_date)

        return descendants

    def is_read(self):
        # TODO: Make it user-specific.
        return self.views is not None

    def get_title(self):
        return self.subject
    
    def get_subject(self):
        return self.subject

    def get_body(self):
        return self.body

    def _set_ancestry(self, new_ancestry):
        descendants = self.get_descendants()
        old_ancestry = self.ancestry or ''
        self.ancestry = new_ancestry

        for descendant in descendants:
            updated_ancestry = descendant.ancestry.replace(
                "%s%d," % (old_ancestry, self.id),
                "%s%d," % (new_ancestry, self.id),
                1
            )
            descendant.ancestry = updated_ancestry
            
    def set_parent(self, parent):
        self.parent = parent

        self._set_ancestry("%s%d," % (
            parent.ancestry or '',
            parent.id
        ))
        
        self.db.add(self)
        self.db.flush()

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


    def __repr__(self):
        return "<Post %s '%s'>" % (
            self.id,
            self.type,
        )


def orm_insert_listener(mapper, connection, target):
    """ This is to allow the root idea to send update to "All posts", 
    "Synthesis posts" and "orphan posts" in the table of ideas", if the post
    isn't otherwise linked to the table of idea """
    target.discussion.root_idea.send_to_changes(connection)
        
event.listen(Post, 'after_insert', orm_insert_listener, propagate=True)
    


class AssemblPost(Post):
    """
    A Post that originated directly on the Assembl system (wasn't imported from elsewhere).
    """
    __tablename__ = "assembl_post"

    id = Column(Integer, ForeignKey(
        'post.id',
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)


    __mapper_args__ = {
        'polymorphic_identity': 'assembl_post',
    }

class SynthesisPost(AssemblPost):
    """
    A Post that publishes a synthesis.
    """
    __tablename__ = "synthesis_post"

    id = Column(Integer, ForeignKey(
        'assembl_post.id',
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    publishes_synthesis_id = Column(
        Integer,
        ForeignKey('synthesis.id', ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False
    )
    
    publishes_synthesis = relationship('Synthesis',
                                     backref=backref('published_in_post',uselist=False))
    
    __mapper_args__ = {
        'polymorphic_identity': 'synthesis_post',
    }
    
    def __init__(self, *args, **kwargs):
        super(SynthesisPost, self).__init__(*args, **kwargs)
        self.publishes_synthesis.publish()

class ImportedPost(Post):
    """
    A Post that originated outside of the Assembl system (was imported from elsewhere).
    """
    __tablename__ = "imported_post"

    id = Column(Integer, ForeignKey(
        'post.id',
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    import_date = Column(DateTime, nullable=False, default=datetime.utcnow)

    source_id = Column(Integer, ForeignKey('post_source.id', ondelete='CASCADE'),
        info= {'rdf': QuadMapPatternS(None, ASSEMBL.has_origin,
                    ContentSource.iri_class().apply())})
    source = relationship(
        "PostSource",
        backref=backref('contents', order_by=import_date)
    )

    __mapper_args__ = {
        'polymorphic_identity': 'imported_post',
    }
