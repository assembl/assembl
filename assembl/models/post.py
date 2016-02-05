from datetime import datetime
from abc import ABCMeta, abstractmethod
import uuid
import logging

from bs4 import BeautifulSoup
import simplejson as json
from sqlalchemy import (
    Column,
    UniqueConstraint,
    Integer,
    DateTime,
    String,
    UnicodeText,
    ForeignKey,
    Binary,
    Text,
    or_,
    event,
    func
)
from sqlalchemy.orm import (
    relationship, backref, deferred, column_property, with_polymorphic)

from ..lib.sqla import UPDATE_OP
from ..lib.decl_enums import DeclEnum
from ..semantic.virtuoso_mapping import QuadMapPatternS
from virtuoso.alchemy import CoerceUnicode
from .generic import Content, ContentSource
from .auth import AgentProfile
from ..semantic.namespaces import SIOC, ASSEMBL, QUADNAMES
from ..lib import config
from .langstrings import LangString, LangStringEntry
from assembl.views.traversal import AbstractCollectionDefinition


log = logging.getLogger('assembl')


class PostVisitor(object):
    CUT_VISIT = object()
    __metaclass__ = ABCMeta

    @abstractmethod
    def visit_post(self, post):
        pass


class PublicationStates(DeclEnum):
    DRAFT = "DRAFT", ""
    SUBMITTED_IN_EDIT_GRACE_PERIOD = "SUBMITTED_IN_EDIT_GRACE_PERIOD", ""
    SUBMITTED_AWAITING_MODERATION = "SUBMITTED_AWAITING_MODERATION", ""
    PUBLISHED = "PUBLISHED", ""
    MODERATED_TEXT_ON_DEMAND = "MODERATED_TEXT_ON_DEMAND", ""
    MODERATED_TEXT_NEVER_AVAILABLE = "MODERATED_TEXT_NEVER_AVAILABLE", ""
    DELETED_BY_USER = "DELETED_BY_USER", ""
    DELETED_BY_ADMIN = "DELETED_BY_ADMIN", ""

blocking_publication_states = {
    PublicationStates.MODERATED_TEXT_NEVER_AVAILABLE,
    PublicationStates.DELETED_BY_USER,
    PublicationStates.DELETED_BY_ADMIN
}

moderated_publication_states = {
    PublicationStates.MODERATED_TEXT_NEVER_AVAILABLE,
    PublicationStates.MODERATED_TEXT_ON_DEMAND
}

deleted_publication_states = {
    PublicationStates.DELETED_BY_USER,
    PublicationStates.DELETED_BY_ADMIN
}


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

    # This is usually an email, but we won't enforce it because we get some
    # weird stuff from outside.
    message_id = Column(CoerceUnicode,
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

    publication_state = Column(
        PublicationStates.db_type(),
        nullable=False,
        server_default=PublicationStates.PUBLISHED.name)

    moderator_id = Column(Integer, ForeignKey(
        'user.id',
        ondelete='SET NULL',
        onupdate='CASCADE'),
        nullable=True,)

    moderated_on = Column(DateTime)

    moderation_text = Column(UnicodeText)

    moderator_comment = Column(UnicodeText)  # For other moderators

    moderator = relationship(
        "User",
        foreign_keys=[moderator_id],
        backref=backref('posts_moderated'),
    )

    idea_content_links_above_post = column_property(
        func.idea_content_links_above_post(id),
        deferred=True, expire_on_flush=False)

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
    creator = relationship(AgentProfile, foreign_keys=[creator_id], backref="posts_created")

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

    @staticmethod
    def shorten_text(text, target_len=120):
        if len(text) > target_len:
            text = text[:target_len].rsplit(' ', 1)[0].rstrip() + ' '
        return text

    @staticmethod
    def shorten_html_text(text, target_len=120):
        shortened = False
        html_len = 2 * target_len
        while True:
            pure_text = BeautifulSoup(text[:html_len]).get_text().strip()
            if html_len >= len(text) or len(pure_text) > target_len:
                shortened = html_len < len(text)
                text = pure_text
                break
            html_len += target_len
        text = Post.shorten_text(text)
        if shortened and text[-1] != ' ':
            text += ' '
        return text

    def get_body_preview(self):
        if self.publication_state in moderated_publication_states:
            # TODO: Handle multilingual moderation
            return LangString.create(
                self.moderation_text, self.discussion.main_locale)
        elif self.publication_state in deleted_publication_states:
            return None
        body = self.get_body()
        is_html = self.get_body_mime_type() == 'text/html'
        ls = LangString()
        shortened = False
        for entry in body.entries:
            if is_html:
                short = self.shorten_html_text(entry.value)
            else:
                short = self.shorten_text(entry.value)
            if short != entry.value:
                shortened = True
            _ = LangStringEntry(
                value=short, locale_id=entry.locale_id, langstring=ls)
        if shortened or is_html:
            return ls
        else:
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

    def ancestor_ids(self):
        ancestor_ids = [
            int(ancestor_id) \
            for ancestor_id \
            in self.ancestry.split(',') \
            if ancestor_id
        ]
        return ancestor_ids

    def ancestors(self):

        ancestors = [
            Post.get(ancestor_id) \
            for ancestor_id \
            in self.ancestor_ids
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

    def get_body(self):
        if self.publication_state in blocking_publication_states:
            return None
        if self.body:
            return super(Post, self).get_body()

    def get_body_as_html(self):
        if self.publication_state in blocking_publication_states:
            return None
        return super(Post, self).get_body_as_html()

    def get_body_as_text(self):
        if self.publication_state in blocking_publication_states:
            return None
        return super(Post, self).get_body_as_text()

    def indirect_idea_content_links(self):
        from pyramid.threadlocal import get_current_request
        request = get_current_request()
        if request:
            return self.indirect_idea_content_links_with_cache()
        else:
            return self.indirect_idea_content_links_without_cache()

    def indirect_idea_content_links_without_cache(self):
        "Return all ideaContentLinks related to this post or its ancestors"
        from .idea_content_link import IdeaContentLink
        ancestors = filter(None, self.ancestry.split(","))
        ancestors = [int(x) for x in ancestors]
        ancestors.append(self.id)
        return self.db.query(IdeaContentLink).filter(
            IdeaContentLink.content_id.in_(ancestors)).all()

    def indirect_idea_content_links_with_cache(self):
        "Return all ideaContentLinks related to this post or its ancestors"
        # WIP: idea_content_links_above_post is still loaded separately
        # despite not being deferred. Deferring it hits a sqlalchemy bug.
        # Still appreciable performance gain using it instead of the orm,
        # and the ICL cache below.
        if not self.idea_content_links_above_post:
            return []
        from pyramid.threadlocal import get_current_request
        from .idea_content_link import IdeaContentLink
        from .idea import Idea
        icl_polymap = IdeaContentLink.__mapper__.polymorphic_map
        request = get_current_request()
        if getattr(request, "_idea_content_link_cache2", None) is None:
            if getattr(request, "_idea_content_link_cache1", None) is None:
                icl = with_polymorphic(IdeaContentLink, IdeaContentLink)
                co = with_polymorphic(Content, Content)
                request._idea_content_link_cache1 = {x[0]: x for x in self.db.query(
                    icl.id, icl.idea_id, icl.content_id, icl.creator_id, icl.type,
                    icl.creation_date).join(co).filter(
                    co.discussion_id == self.discussion_id)}
            request._idea_content_link_cache2 = {}

        def icl_representation(id):
            if id not in request._idea_content_link_cache2:
                data = request._idea_content_link_cache1.get(id, None)
                if data is None:
                    return None
                request._idea_content_link_cache2[id] = {
                    "@id": IdeaContentLink.uri_generic(data[0]),
                    "idIdea": Idea.uri_generic(data[1]),
                    "idPost": Content.uri_generic(data[2]),
                    "idCreator": AgentProfile.uri_generic(data[3]),
                    "@type": icl_polymap[data[4]].class_.external_typename(),
                    "created": data[5].isoformat() + "Z"
                }
            return request._idea_content_link_cache2[id]
        return [icl_representation(int(id)) for id in
                self.idea_content_links_above_post[:-1].split(',')]

    @classmethod
    def extra_collections(cls):
        from .idea_content_link import IdeaContentLink

        class IdeaContentLinkCollection(AbstractCollectionDefinition):
            def __init__(self, cls):
                super(IdeaContentLinkCollection, self
                      ).__init__(cls, IdeaContentLink)

            def decorate_query(
                    self, query, owner_alias, last_alias, parent_instance,
                    ctx):
                parent = owner_alias
                children = last_alias
                ancestors = filter(None, parent_instance.ancestry.split(","))
                ancestors = [int(x) for x in ancestors]
                ancestors.append(parent_instance.id)
                return query.join(
                    parent, children.content_id.in_(ancestors))

            def decorate_instance(
                    self, instance, parent_instance, assocs, user_id,
                    ctx, kwargs):
                pass

            def contains(self, parent_instance, instance):
                return instance.content_id == parent_instance.id or (
                    str(instance.content_id) in
                    parent_instance.ancestry.split(","))

        return {'indirect_idea_content_links': IdeaContentLinkCollection(cls)}
    @classmethod
    def restrict_to_owners(cls, query, user_id):
        "filter query according to object owners"
        return query.filter(cls.creator_id == user_id)


def orm_insert_listener(mapper, connection, target):
    """ This is to allow the root idea to send update to "All posts",
    "Synthesis posts" and "orphan posts" in the table of ideas", if the post
    isn't otherwise linked to the table of idea """
    if target.discussion.root_idea:
        target.discussion.root_idea.send_to_changes(connection)
    # Check if this is the first post by this user in the discussion.
    # In which case, tell the discussion about this new participant,
    # which was not in Discussion.get_participants_query originally.
    if target.db.query(Post).filter_by(
            creator_id=target.creator_id,
            discussion_id=target.discussion_id).count() <= 1:
        creator = target.creator or AgentProfile.get(target.creator_id)
        creator.send_to_changes(connection, UPDATE_OP, target.discussion_id)
    # Eagerly translate the post
    from ..tasks.translate import translate_content_task
    translate_content_task.delay(target.id)

event.listen(Post, 'after_insert', orm_insert_listener, propagate=True)


class AssemblPost(Post):
    """
    A Post that originated directly on the Assembl system (wasn't imported from elsewhere).
    """
    __tablename__ = "assembl_post"

    def __init__(self, *args, **kwargs):
        if 'message_id' not in kwargs:
            kwargs['message_id'] = self.generate_message_id()
        super(Post, self).__init__(*args, **kwargs)

    @classmethod
    def generate_message_id(cls):
        # Create a local message_id with uuid1 and hostname
        return uuid.uuid1().hex+"_assembl@"+config.get('public_hostname')

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

    def as_html(self, jinja_env):
        return self.publishes_synthesis.as_html(jinja_env)


class WidgetPost(AssemblPost):
    """
    A Post that comes from an inspiration widget
    """
    # historical name
    __tablename__ = "post_with_metadata"

    id = Column(Integer, ForeignKey(
        AssemblPost.id,
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    metadata_raw = Column(Text)

    # Make it nullable, if we delete widget.
    widget_id = Column(Integer, ForeignKey(
        "widget.id",
        ondelete='SET NULL',
        onupdate='CASCADE'
        ), nullable=True,
        info={"pseudo_nullable": False})

    widget = relationship("Widget", backref="posts")

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


class IdeaProposalPost(WidgetPost):
    """
    A Post that proposes an Idea.
    """
    __tablename__ = "idea_proposal_post"

    id = Column(Integer, ForeignKey(
        WidgetPost.id,
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

    def __init__(self, *args, **kwargs):
        if 'message_id' not in kwargs:
            assert 'source_post_id' in kwargs
            source = kwargs.get('source', None)
            if not source:
                source_id = kwargs.get('source_id', None)
                assert source_id
                source = ContentSource.get(int(source_id))
                assert source
            kwargs['message_id'] = source.generate_message_id(
                kwargs['source_post_id'])
        super(Post, self).__init__(*args, **kwargs)

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



@event.listens_for(ImportedPost.source_post_id, 'set', propagate=True)
def receive_set(target, value, oldvalue, initiator):
    "listen for the 'set' event, keeps the message_id in Post class in sync with the source_post_id"
    source = target.source or ContentSource.get(target.source_id)
    target.message_id = source.generate_message_id(value)
