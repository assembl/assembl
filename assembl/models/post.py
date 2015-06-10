from datetime import datetime
from abc import ABCMeta, abstractmethod

from bs4 import BeautifulSoup
import simplejson as json
from sqlalchemy.orm import relationship, backref, aliased, deferred
from sqlalchemy.sql import func
from sqlalchemy import (
    Column,
    UniqueConstraint,
    Integer,
    DateTime,
    String,
    ForeignKey,
    UnicodeText,
    Binary,
    Text,
    or_,
    event,
)

from ..semantic.virtuoso_mapping import QuadMapPatternS
from virtuoso.alchemy import CoerceUnicode
from .generic import Content, ContentSource
from .auth import AgentProfile
from ..semantic.namespaces import  SIOC, CATALYST, IDEA, ASSEMBL, DCTERMS, QUADNAMES


class PostVisitor(object):
    CUT_VISIT = object()
    __metaclass__ = ABCMeta
    @abstractmethod
    def visit_post(self, post):
        pass


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

    message_id = Column(CoerceUnicode(),
                        nullable=False,
                        index=True,
                        doc="The email-compatible message-id for the post.",
                        info={'rdf': QuadMapPatternS(None, SIOC.id)})

    ancestry = Column(String, default="")

    parent_id = Column(Integer, ForeignKey(
        'post.id',
        ondelete='CASCADE',
        onupdate='SET NULL'))
    children = relationship(
        "Post",
        foreign_keys=[parent_id],
        backref=backref('parent', remote_side=[id]),
    )

    @classmethod
    def special_quad_patterns(cls, alias_maker, discussion_id):
        # Don't we need a recursive alias for this? It seems not.
        return [
            QuadMapPatternS(
                Post.iri_class().apply(cls.id),
                SIOC.reply_of,
                cls.iri_class().apply(cls.parent_id),
                name=QUADNAMES.post_parent,
                conditions=(cls.parent_id != None,)),
        ]

    creator_id = Column(Integer, ForeignKey('agent_profile.id'), nullable=False,
        info={'rdf': QuadMapPatternS(
            None, SIOC.has_creator, AgentProfile.agent_as_account_iri.apply(None))})
    creator = relationship(AgentProfile, backref="posts_created")

    __mapper_args__ = {
        'polymorphic_identity': 'post',
        'with_polymorphic': '*'
    }

    def get_descendants(self):
        assert self.id
        descendants = self.db.query(Post).filter(
            Post.parent_id == self.id).order_by(
            Content.creation_date)

        return descendants

    def is_read(self):
        # TODO: Make it user-specific.
        return self.views is not None

    def get_url(self):
        from assembl.lib.frontend_urls import FrontendUrls
        frontendUrls = FrontendUrls(self.discussion)
        return frontendUrls.get_post_url(self)

    def get_body_as_html(self):
        if self.get_body_mime_type == 'text/html':
            return self.body
        else:
            return '<span style="white-space: pre-wrap">%s</div>' % self.body

    def get_body_preview(self):
        body = self.get_body().strip()
        target_len = 120
        shortened = False
        if self.get_body_mime_type() == 'text/html':
            html_len = 2 * target_len
            while True:
                text = BeautifulSoup(body[:html_len]).get_text().strip()
                if html_len >= len(body) or len(text) > target_len:
                    shortened = html_len < len(body)
                    body = text
                    break
                html_len += target_len
        if len(body) > target_len:
            body = body[:target_len].rsplit(' ', 1)[0].rstrip() + ' '
        elif shortened:
            body += ' '
        return body

    def _set_ancestry(self, new_ancestry):
        self.ancestry = new_ancestry

        descendant_ancestry = "%s%d," % (
            self.ancestry, self.id)
        for descendant in self.get_descendants():
            descendant._set_ancestry(descendant_ancestry)

    def set_parent(self, parent):
        self.parent = parent

        self.db.add(self)
        self.db.flush()

        self._set_ancestry("%s%d," % (
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
            Post.get(ancestor_id) \
            for ancestor_id \
            in ancestor_ids
        ]

        return ancestors

    def prefetch_descendants(self):
        pass  #TODO

    def visit_posts_depth_first(self, post_visitor):
        self.prefetch_descendants()
        self._visit_posts_depth_first(post_visitor, set())

    def _visit_posts_depth_first(self, post_visitor, visited):
        if self in visited:
            # not necessary in a tree, but let's start to think graph.
            return False
        result = post_visitor.visit_post(self)
        visited.add(self)
        if result is not PostVisitor.CUT_VISIT:
            for child in self.children:
                child._visit_posts_depth_first(post_visitor, visited)

    def visit_posts_breadth_first(self, post_visitor):
        self.prefetch_descendants()
        result = post_visitor.visit_post(self)
        visited = {self}
        if result is not PostVisitor.CUT_VISIT:
            self._visit_posts_breadth_first(post_visitor, visited)

    def _visit_posts_breadth_first(self, post_visitor, visited):
        children = []
        for child in self.children:
            if child in visited:
                continue
            result = post_visitor.visit_post(child)
            visited.add(child)
            if result != PostVisitor.CUT_VISIT:
                children.append(child)
        for child in children:
            child._visit_posts_breadth_first(post_visitor, visited)

    def has_next_sibling(self):
        if self.parent_id:
            return self != self.parent.children[-1]
        return False

    @classmethod
    def restrict_to_owners(cls, query, user_id):
        "filter query according to object owners"
        return query.filter(cls.creator_id == user_id)

    def __repr__(self):
        return "<Post %s '%s'>" % (
            self.id,
            self.type,
        )


def orm_insert_listener(mapper, connection, target):
    """ This is to allow the root idea to send update to "All posts",
    "Synthesis posts" and "orphan posts" in the table of ideas", if the post
    isn't otherwise linked to the table of idea """
    if target.discussion.root_idea:
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

    def get_body_mime_type(self):
        return "text/plain"

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
        self.publishes_synthesis = self.publishes_synthesis.publish()

    def get_body_mime_type(self):
        return "text/html"

    def get_title(self):
        return self.publishes_synthesis.subject


class PostWithMetadata(AssemblPost):
    """
    A Post that comes from an inspiration widget
    """
    __tablename__ = "post_with_metadata"

    id = Column(Integer, ForeignKey(
        AssemblPost.id,
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    metadata_raw = Column(Text)

    @property
    def metadata_json(self):
        if self.metadata_raw:
            return json.loads(self.metadata_raw)
        return {}

    @metadata_json.setter
    def metadata_json(self, val):
        self.metadata_raw = json.dumps(val)

    __mapper_args__ = {
        'polymorphic_identity': 'post_with_metadata',
    }


class IdeaProposalPost(PostWithMetadata):
    """
    A Post that proposes an Idea.
    """
    __tablename__ = "idea_proposal_post"

    id = Column(Integer, ForeignKey(
        PostWithMetadata.id,
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    idea_id = Column(
        Integer,
        ForeignKey('idea.id', ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False
    )

    proposes_idea = relationship('Idea',
                                 backref=backref('proposed_in_post',uselist=False))

    __mapper_args__ = {
        'polymorphic_identity': 'idea_proposal_post',
    }


class ImportedPost(Post):
    """
    A Post that originated outside of the Assembl system (was imported from elsewhere).
    """
    __tablename__ = "imported_post"
    __table_args__ = (
                UniqueConstraint('source_post_id', 'source_id'),
            )
    id = Column(Integer, ForeignKey(
        'post.id',
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    import_date = Column(DateTime, nullable=False, default=datetime.utcnow)

    source_post_id = Column(CoerceUnicode(),
                        nullable=False,
                        doc="The source-specific unique id of the imported post.  A listener keeps the message_id in the post class in sync")

    source_id = Column('source_id', Integer, ForeignKey(
        'post_source.id', ondelete='CASCADE'), nullable=False,
        info={'rdf': QuadMapPatternS(None, ASSEMBL.has_origin)})

    source = relationship(
        "PostSource",
        backref=backref('contents')
    )

    body_mime_type = Column(CoerceUnicode(),
                        nullable=False,
                        doc="The mime type of the body of the imported content.  See Content::get_body_mime_type() for allowed values.")

    imported_blob = deferred(Column(Binary), group='raw_details')

    __mapper_args__ = {
        'polymorphic_identity': 'imported_post',
    }

    def get_body_mime_type(self):
        return self.body_mime_type

    def unique_query(self):
        query, _ = super(ImportedPost, self).unique_query()
        source_id = self.source_id or self.source.id
        return query.filter_by(
            source_id=source_id,
            source_post_id=self.source_post_id), True



# @event.listens_for(ImportedPost.source_post_id, 'set', propagate=True)
# def receive_set(target, value, oldvalue, initiator):
#     "listen for the 'set' event, keeps the message_id in Post class in sync with the source_post_id"

#     target.message_id = target.source.get_default_prepend_id() + value
