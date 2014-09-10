import re
import quopri
from datetime import datetime

from sqlalchemy.orm import (relationship, backref)
from sqlalchemy import (
    Column,
    Boolean,
    Integer,
    String,
    Float,
    UnicodeText,
    DateTime,
    ForeignKey,
    event,
)
from rdflib import URIRef
from virtuoso.vmapping import PatternIriClass

from . import DiscussionBoundBase
from ..semantic.virtuoso_mapping import QuadMapPatternS
from ..lib.sqla import (UPDATE_OP, DELETE_OP, INSERT_OP, get_model_watcher)
from .discussion import Discussion
from .auth import AgentProfile
from .idea import Idea
from .generic import Content
from .post import Post
from .mail import IMAPMailbox
from ..auth import (
    CrudPermissions, P_READ, P_EDIT_IDEA,
    P_EDIT_EXTRACT, P_ADD_IDEA, P_ADD_EXTRACT,
    P_EDIT_MY_EXTRACT)
from ..semantic.namespaces import (
    CATALYST, ASSEMBL, DCTERMS, OA, QUADNAMES)


class IdeaContentLink(DiscussionBoundBase):
    """
    Abstract class representing a generic link between an idea and a Content
    (typically a Post)
    """
    __tablename__ = 'idea_content_link'
    # TODO: How to express the implied link as RDF? Remember not reified, unless extract.

    id = Column(Integer, primary_key=True,
                info= {'rdf': QuadMapPatternS(None, ASSEMBL.db_id)})
    type = Column(String(60))

    # This is nullable, because in the case of extracts, the idea can be
    # attached later.
    idea_id = Column(Integer, ForeignKey('idea.id'),
                     nullable=True, index=True)
    idea = relationship('Idea', active_history=True)

    content_id = Column(Integer, ForeignKey(
        'content.id', ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False, index=True)
    content = relationship(Content, backref=backref(
        'idea_links_of_content', cascade="all, delete-orphan"))

    order = Column(Float, nullable=False, default=0.0)

    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow,
        info= {'rdf': QuadMapPatternS(None, DCTERMS.created)})

    creator_id = Column(
        Integer,
        ForeignKey('agent_profile.id'),
        nullable=False,
    )

    creator = relationship(
        'AgentProfile', foreign_keys=[creator_id], backref='extracts_created')

    __mapper_args__ = {
        'polymorphic_identity': 'assembl:relatedToIdea',
        'polymorphic_on': type,
        'with_polymorphic': '*'
    }

    def get_discussion_id(self):
        if self.idea:
            return self.idea.get_discussion_id()
        elif self.idea_id:
            return Idea.get(id=self.idea_id).get_discussion_id()

    @classmethod
    def get_discussion_condition(cls, discussion_id):
        return (cls.idea_id == Idea.id) & (Idea.discussion_id == discussion_id)

    crud_permissions = CrudPermissions(
            P_ADD_IDEA, P_READ, P_EDIT_IDEA, P_EDIT_IDEA,
            P_EDIT_IDEA, P_EDIT_IDEA)

@event.listens_for(IdeaContentLink.idea, 'set', propagate=True, active_history=True)
def idea_content_link_idea_set_listener(target, value, oldvalue, initiator):
    print "idea_content_link_idea_set_listener for target: %s set to %s, was %s" % (target, value, oldvalue)
    if oldvalue is not None:
        oldvalue.send_to_changes()
        for ancestor in oldvalue.get_all_ancestors():
            ancestor.send_to_changes()
    if value is not None:
        value.send_to_changes()
        for ancestor in value.get_all_ancestors():
            ancestor.send_to_changes()


class IdeaContentWidgetLink(IdeaContentLink):
    """
    A link between an idea and a Content limited to a widget view.
    Such links should not be traversed.
    """
    __tablename__ = 'idea_content_widget_link'

    id = Column(Integer, ForeignKey(
        'idea_content_link.id',
        ondelete='CASCADE', onupdate='CASCADE'
    ), primary_key=True)

    __mapper_args__ = {
        'polymorphic_identity': 'assembl:postHiddenLinkedToIdea',
    }

Idea.widget_owned_contents = relationship(IdeaContentWidgetLink)
Content.widget_idea_links = relationship(
    IdeaContentWidgetLink, cascade="all, delete-orphan")


class IdeaContentPositiveLink(IdeaContentLink):
    """
    A normal link between an idea and a Content.
    Such links should be traversed.
    """
    __tablename__ = 'idea_content_positive_link'

    id = Column(Integer, ForeignKey(
        'idea_content_link.id',
        ondelete='CASCADE', onupdate='CASCADE'
    ), primary_key=True)

    @classmethod
    def special_quad_patterns(cls, alias_manager):
        return [QuadMapPatternS(
            Content.iri_class().apply(cls.content_id),
            ASSEMBL.postLinkedToIdea,
            Idea.iri_class().apply(cls.idea_id),
            name=QUADNAMES.assembl_postLinkedToIdea,
            condition=cls.idea_id != None)]

    __mapper_args__ = {
        'polymorphic_identity': 'assembl:postLinkedToIdea_abstract',
    }


class IdeaRelatedPostLink(IdeaContentPositiveLink):
    """
    A post that is relevant, as a whole, to an idea, without having a specific
    extract harvested.
    """
    __tablename__ = 'idea_related_post_link'

    id = Column(Integer, ForeignKey(
        'idea_content_positive_link.id',
        ondelete='CASCADE', onupdate='CASCADE'
    ), primary_key=True)

    @classmethod
    def special_quad_patterns(cls, alias_manager):
        return [QuadMapPatternS(
            Content.iri_class().apply(cls.content_id),
            ASSEMBL.postRelatedToIdea,
            Idea.iri_class().apply(cls.idea_id),
            name=QUADNAMES.assembl_postRelatedToIdea,
            condition=cls.idea_id != None)]

    __mapper_args__ = {
        'polymorphic_identity': 'assembl:postLinkedToIdea',
    }


class Extract(IdeaContentPositiveLink):
    """
    An extracted part of a Content. A quotation to be referenced by an `Idea`.
    """
    __tablename__ = 'extract'
    rdf_class = CATALYST.Excerpt

    id = Column(Integer, ForeignKey(
            'idea_content_positive_link.id',
            ondelete='CASCADE', onupdate='CASCADE'
        ), primary_key=True, info= {
            'rdf': QuadMapPatternS(None, ASSEMBL.db_id)})

    graph_iri_class = PatternIriClass(
        QUADNAMES.ExcerptGraph_iri,
        'http://%{WSHostName}U/data/ExcerptGraph/%d',
        None,
        ('id', Integer, False))

    body = Column(UnicodeText, nullable=False)

    discussion_id = Column(Integer, ForeignKey(
        'discussion.id', ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False, index=True,
        info = {'rdf': QuadMapPatternS(None, CATALYST.relevantToConversation)})
    discussion = relationship(Discussion, backref='extracts')

    important = Column('important', Boolean, server_default='0')

    def extract_graph_name(self):
        from pyramid.threadlocal import get_current_registry
        reg = get_current_registry()
        host = reg.settings['public_hostname']
        return URIRef('http://%s/data/ExcerptGraph/%d' % (host, self.id))

    def extract_graph_iri(self):
        return getattr(QUADNAMES, 'extract_%d_iri' % self.id)

    @classmethod
    def special_quad_patterns(cls, alias_manager):
        return [
            QuadMapPatternS(
                None, OA.hasBody,
                cls.graph_iri_class.apply(cls.id),
                name=QUADNAMES.oa_hasBody,
                condition=cls.idea_id != None),
            QuadMapPatternS(
                Content.iri_class().apply(cls.content_id),
                ASSEMBL.postExtractRelatedToIdea,
                Idea.iri_class().apply(cls.idea_id),
                name=QUADNAMES.assembl_postExtractRelatedToIdea,
                condition=cls.idea_id != None)
            ]


    annotation_text = Column(UnicodeText)

    owner_id = Column(
        Integer,
        ForeignKey('agent_profile.id'),
        nullable=False,
    )

    owner = relationship(
        'AgentProfile', foreign_keys=[owner_id], backref='extracts_owned')

    extract_source = relationship(Content, backref="extracts")
    extract_ideas = relationship(Idea, backref="extracts")

    __mapper_args__ = {
        'polymorphic_identity': 'assembl:postExtractRelatedToIdea',
    }
    @property
    def target(self):
        retval = {
                '@type': self.content.external_typename()
                }
        if isinstance(self.content, Post):
            retval['@id'] = Post.uri_generic(self.content.id)
        elif self.content.type == 'webpage':
            retval['url'] = self.content.url
        return retval

    def serializable(self):
        json = {
            '@id': self.uri_generic(self.id),
            '@type': self.external_typename(),
            'annotator_schema_version': 'v1.0',
            'quote': self.body,
            'ranges': [tfi.__json__() for tfi
                       in self.text_fragment_identifiers],
            'target': self.target,
            'important': self.important,
            'created': self.creation_date.isoformat(),
            'idCreator': AgentProfile.uri_generic(self.creator_id),
            #'user': self.creator.get_uri(),
            'text': self.annotation_text,
        }
        if self.idea_id:
            json['idIdea'] = Idea.uri_generic(self.idea_id)
            #json['text'] += '<a href="%s">%s</a>' % (
            #   self.idea.get_uri(), self.idea.short_title)
        if isinstance(self.content, Post):
            json['idPost'] = Post.uri_generic(self.content.id)  # legacy
            #json['url'] = self.post.get_uri()
        elif self.content.type == 'webpage':
            json['uri'] = self.content.url
        return json

    def __repr__(self):
        return "<Extract %d %s>" % (self.id or -1, repr(self.body[:20]))

    def get_target(self):
        return self.content

    def get_post(self):
        if isinstance(self.content, Post):
            return self.content

    def infer_text_fragment(self):
        return self._infer_text_fragment_inner(
            self.content.get_title(), self.content.get_body(),
            self.get_post().id)

    def _infer_text_fragment_inner(self, title, body, post_id):
        body = IMAPMailbox.sanitize_html(body, [])
        quote = self.body.replace("\r", "")
        try:
            # for historical reasons
            quote = quopri.decodestring(quote)
        except:
            pass
        quote = IMAPMailbox.sanitize_html(quote, [])
        if quote != self.body:
            self.body = quote
        quote = quote.replace("\n", "")
        start = body.find(quote)
        lookin = 'message-body'
        if start < 0:
            xpath = "//div[@id='%s']/div[class='post_title']" % (post_id)
            start = title.find(quote)
            if start < 0:
                return None
            lookin = 'message-subject'
        xpath = "//div[@id='message-%s']//div[@class='%s']" % (
            Post.uri_generic(post_id), lookin)
        tfi = self.db.query(TextFragmentIdentifier).filter_by(
            extract=self).first()
        if not tfi:
            tfi = TextFragmentIdentifier(extract=self)
        tfi.xpath_start = tfi.xpath_end = xpath
        tfi.offset_start = start
        tfi.offset_end = start+len(quote)
        return tfi

    def send_to_changes(self, connection=None, operation=UPDATE_OP):
        super(Extract, self).send_to_changes(connection, operation)
        watcher = get_model_watcher()
        if operation == UPDATE_OP:
            watcher.processExtractModified(self.id, 0)  # no versions yet.
        elif operation == DELETE_OP:
            watcher.processExtractDeleted(self.id)
        elif operation == INSERT_OP:
            watcher.processExtractCreated(self.id)

    def get_discussion_id(self):
        return self.discussion_id

    @classmethod
    def get_discussion_condition(cls, discussion_id):
        return cls.discussion_id == discussion_id

    crud_permissions = CrudPermissions(
            P_ADD_EXTRACT, P_READ, P_EDIT_EXTRACT, P_EDIT_EXTRACT,
            P_EDIT_MY_EXTRACT, P_EDIT_MY_EXTRACT)

class IdeaContentNegativeLink(IdeaContentLink):
    """
    A negative link between an idea and a Content.  Such links mean that
    a transitive context should be considered broken.  Used for thread breaking
    """
    __tablename__ = 'idea_content_negative_link'

    id = Column(Integer, ForeignKey(
        'idea_content_link.id',
        ondelete='CASCADE', onupdate='CASCADE'
    ), primary_key=True)

    __mapper_args__ = {
        'polymorphic_identity': 'assembl:postDelinkedToIdea_abstract',
    }


class IdeaThreadContextBreakLink(IdeaContentNegativeLink):
    """
    Used for a Post the inherits an Idea from an ancester in the thread.
    It indicates that from this point on in the thread, this idea is no longer
    discussed.
    """
    __tablename__ = 'idea_thread_context_break_link'

    id = Column(Integer, ForeignKey(
        'idea_content_negative_link.id',
        ondelete='CASCADE', onupdate='CASCADE'
    ), primary_key=True)

    __mapper_args__ = {
        'polymorphic_identity': 'assembl:postDelinkedToIdea',
    }


class TextFragmentIdentifier(DiscussionBoundBase):
    __tablename__ = 'text_fragment_identifier'
    rdf_class = CATALYST.ExcerptTarget

    id = Column(Integer, primary_key=True,
                info= {'rdf': QuadMapPatternS(None, ASSEMBL.db_id)})
    extract_id = Column(Integer, ForeignKey(
        Extract.id, ondelete="CASCADE"), index=True)
    xpath_start = Column(String)
    offset_start = Column(Integer)
    xpath_end = Column(String)
    offset_end = Column(Integer)
    extract = relationship(Extract, backref=backref(
        'text_fragment_identifiers', cascade="all, delete-orphan"))

    @classmethod
    def special_quad_patterns(cls, alias_manager):
        return [
            QuadMapPatternS(
                Extract.iri_class().apply(cls.extract_id),
                OA.hasTarget,
                cls.iri_class().apply(cls.id),
                name=QUADNAMES.oa_hasTarget,
                condition=cls.extract_id != None),
            # TODO: Paths!
            # QuadMapPatternS(OA.hasSource,
            #     Extract.iri_class().apply((cls.extract_id, Extract.content_id)),
            #     name=QUADNAMES.catalyst_expressesIdea),
            ]

    xpath_re = re.compile(
        r'xpointer\(start-point\(string-range\(([^,]+),([^,]+),([^,]+)\)\)'
        r'/range-to\(string-range\(([^,]+),([^,]+),([^,]+)\)\)\)')

    def __string__(self):
        return ("xpointer(start-point(string-range(%s,'',%d))/"
                "range-to(string-range(%s,'',%d)))" % (
                self.xpath_start, self.offset_start,
                self.xpath_end, self.offset_end))

    def __json__(self):
        return {"start": self.xpath_start, "startOffset": self.offset_start,
                "end": self.xpath_end, "endOffset": self.offset_end}

    @classmethod
    def from_xpointer(cls, extract_id, xpointer):
        m = cls.xpath_re.match(xpointer)
        if m:
            try:
                (xpath_start, start_text, offset_start,
                    xpath_end, end_text, offset_end) = m.groups()
                offset_start = int(offset_start)
                offset_end = int(offset_end)
                xpath_start = xpath_start.strip()
                assert xpath_start[0] in "\"'"
                xpath_start = xpath_start.strip(xpath_start[0])
                xpath_end = xpath_end.strip()
                assert xpath_end[0] in "\"'"
                xpath_end = xpath_end.strip(xpath_end[0])
                return TextFragmentIdentifier(
                    extract_id=extract_id,
                    xpath_start=xpath_start, offset_start=offset_start,
                    xpath_end=xpath_end, offset_end=offset_end)
            except:
                pass
        return None

    def get_discussion_id(self):
        if self.extract:
            return self.extract.get_discussion_id()
        elif self.extract_id:
            return Extract.get(id=self.extract_id).get_discussion_id()

    @classmethod
    def get_discussion_condition(cls, discussion_id):
        return (cls.extract_id == Extract.id) & \
            (Extract.discussion_id == discussion_id)

    crud_permissions = CrudPermissions(
            P_ADD_EXTRACT, P_READ, P_EDIT_EXTRACT, P_EDIT_EXTRACT,
            P_EDIT_MY_EXTRACT, P_EDIT_MY_EXTRACT)
