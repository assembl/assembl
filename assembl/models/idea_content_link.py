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
from .idea import Idea
from .generic import Content
from .post import Post
from .mail import IMAPMailbox
from ..auth import (
    CrudPermissions, P_READ, P_EDIT_IDEA,
    P_EDIT_EXTRACT, P_ADD_IDEA, P_ADD_EXTRACT,
    P_EDIT_MY_EXTRACT)
from ..semantic.namespaces import (
    CATALYST, ASSEMBL, DCTERMS, OA, QUADNAMES, RDF, SIOC)


class IdeaContentLink(DiscussionBoundBase):
    """
    Abstract class representing a generic link between an idea and a Content
    (typically a Post)
    """
    __tablename__ = 'idea_content_link'
    # TODO: How to express the implied link as RDF? Remember not reified, unless extract.

    id = Column(Integer, primary_key=True,
                info={'rdf': QuadMapPatternS(None, ASSEMBL.db_id)})
    type = Column(String(60))

    # This is nullable, because in the case of extracts, the idea can be
    # attached later.
    idea_id = Column(Integer, ForeignKey(Idea.id),
                     nullable=True, index=True)
    idea = relationship(Idea, active_history=True)

    content_id = Column(Integer, ForeignKey(
        'content.id', ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False, index=True)
    content = relationship(Content, backref=backref(
        'idea_links_of_content', cascade="all, delete-orphan"))

    order = Column(Float, nullable=False, default=0.0)

    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow,
        info={'rdf': QuadMapPatternS(None, DCTERMS.created)})

    creator_id = Column(
        Integer,
        ForeignKey('agent_profile.id'),
        nullable=False,
        info={'rdf': QuadMapPatternS(None, SIOC.has_creator)}
    )

    creator = relationship(
        'AgentProfile', foreign_keys=[creator_id], backref=backref(
            'extracts_created', cascade="all")) # do not delete orphan

    __mapper_args__ = {
        'polymorphic_identity': 'assembl:relatedToIdea',
        'polymorphic_on': type,
        'with_polymorphic': '*'
    }

    def get_discussion_id(self):
        if self.content:
            return self.content.get_discussion_id()
        elif self.content_id:
            return Content.get(self.content_id).get_discussion_id()

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return ((cls.content_id == Content.id),
                (Content.discussion_id == discussion_id))

    discussion = relationship(
        Discussion, viewonly=True, uselist=False, secondary=Content.__table__,
        info={'rdf': QuadMapPatternS(None, ASSEMBL.in_conversation)})


    @classmethod
    def base_conditions(cls, alias=None, alias_maker=None):
        if alias_maker is None:
            idea_content_link = alias or cls
            idea = Idea
        else:
            idea_content_link = alias or alias_maker.alias_from_class(cls)
            idea = alias_maker.alias_from_relns(idea_content_link.idea)
        return ((idea_content_link.idea_id != None),
                (idea.tombstone_date == None))

    crud_permissions = CrudPermissions(
            P_ADD_IDEA, P_READ, P_EDIT_IDEA, P_EDIT_IDEA,
            P_EDIT_IDEA, P_EDIT_IDEA)

@event.listens_for(IdeaContentLink.idea, 'set', propagate=True, active_history=True)
def idea_content_link_idea_set_listener(target, value, oldvalue, initiator):
    print "idea_content_link_idea_set_listener for target: %s set to %s, was %s" % (target, value, oldvalue)
    if oldvalue is not None:
        with oldvalue.db.no_autoflush:
            oldvalue.send_to_changes()
            for ancestor in oldvalue.get_all_ancestors():
                ancestor.send_to_changes()
    if value is not None:
        with value.db.no_autoflush:
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
    def special_quad_patterns(cls, alias_maker, discussion_id):
        return [QuadMapPatternS(
            Content.iri_class().apply(cls.content_id),
            ASSEMBL.postLinkedToIdea,
            Idea.iri_class().apply(cls.idea_id),
            name=QUADNAMES.assembl_postLinkedToIdea,
            conditions=(cls.idea_id != None,))]

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
    def special_quad_patterns(cls, alias_maker, discussion_id):
        return [QuadMapPatternS(
            Content.iri_class().apply(cls.content_id),
            ASSEMBL.postRelatedToIdea,
            Idea.iri_class().apply(cls.idea_id),
            name=QUADNAMES.assembl_postRelatedToIdea,
            conditions=(cls.idea_id != None,))]

    __mapper_args__ = {
        'polymorphic_identity': 'assembl:postLinkedToIdea',
    }


class Extract(IdeaContentPositiveLink):
    """
    An extracted part of a Content. A quotation to be referenced by an `Idea`.
    """
    __tablename__ = 'extract'
    rdf_class = CATALYST.Excerpt
    # Extract ID represents both the oa:Annotation and the oa:SpecificResource
    # TODO: This iri is not yet dereferencable.
    specific_resource_iri = PatternIriClass(
        QUADNAMES.oa_specific_resource_iri,
        'http://%{WSHostName}U/data/SpecificResource/%d', None,
        ('id', Integer, False))

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

    # TODO: body was misused to contain the extract fragment content,
    # which should belong in the TextFragmentIdentifier,
    # whereas it was meant to be a comment on the extract
    # if used from the Web annotator. I'll have to migrate it.
    body = Column(UnicodeText, nullable=False)
    # info={'rdf': QuadMapPatternS(None, OA.hasBody)})

    discussion_id = Column(Integer, ForeignKey(
        'discussion.id', ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False, index=True,
        info={'rdf': QuadMapPatternS(None, CATALYST.relevantToConversation)})
    discussion = relationship(
        Discussion, backref=backref('extracts', cascade="all, delete-orphan"),
        info={'rdf': QuadMapPatternS(None, ASSEMBL.in_conversation)})

    important = Column('important', Boolean, server_default='0')

    def extract_graph_name(self):
        from pyramid.threadlocal import get_current_registry
        reg = get_current_registry()
        host = reg.settings['public_hostname']
        return URIRef('http://%s/data/ExcerptGraph/%d' % (host, self.id))

    def extract_graph_iri(self):
        return getattr(QUADNAMES, 'extract_%d_iri' % self.id)

    @classmethod
    def special_quad_patterns(cls, alias_maker, discussion_id):
        return [
            QuadMapPatternS(
                None, OA.hasBody,
                cls.graph_iri_class.apply(cls.id),
                name=QUADNAMES.oa_hasBody,
                conditions=((cls.idea_id != None),
                            (Idea.tombstone_date == None))),
            QuadMapPatternS(
                #Content.iri_class().apply(cls.content_id),
                cls.specific_resource_iri.apply(cls.id),
                # It would be better to use CATALYST.expressesIdea,
                # but Virtuoso hates the redundancy.
                ASSEMBL.resourceExpressesIdea,
                Idea.iri_class().apply(cls.idea_id),
                name=QUADNAMES.assembl_postExtractRelatedToIdea,
                conditions=((cls.idea_id != None),
                            (Idea.tombstone_date == None)
                   # and it's a post extract... treat webpages separately.
                )),
            QuadMapPatternS(
                None, OA.hasTarget, cls.specific_resource_iri.apply(cls.id),
                name=QUADNAMES.oa_hasTarget),
            QuadMapPatternS(
                cls.specific_resource_iri.apply(cls.id),
                RDF.type, OA.SpecificResource,
                name=QUADNAMES.oa_SpecificResource_type),
            QuadMapPatternS(
                cls.specific_resource_iri.apply(cls.id),
                ASSEMBL.in_conversation,
                Discussion.iri_class().apply(cls.discussion_id),
                name=QUADNAMES.oa_SpecificResource_in_conversation),
            QuadMapPatternS(
                cls.specific_resource_iri.apply(cls.id), OA.hasSource,
                Content.iri_class().apply(cls.content_id),
                name=QUADNAMES.oa_hasSource),
            # TODO: Paths
            # QuadMapPatternS(
            #     AgentProfile.iri_class().apply((cls.content_id, Post.creator_id)),
            #     DCTERMS.contributor,
            #     Idea.iri_class().apply(cls.idea_id),
            #     name=QUADNAMES.assembl_idea_contributor,
            #     conditions=(cls.idea_id != None,)),
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
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return (cls.discussion_id == discussion_id,)

    @classmethod
    def base_conditions(cls, alias=None, alias_maker=None):
        # Allow idea-less extracts
        return ()

    @classmethod
    def restrict_to_owners(cls, query, user_id):
        "filter query according to object owners"
        return query.filter(cls.owner_id == user_id)

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
    ), nullable=False, primary_key=True)

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
    rdf_class = OA.FragmentSelector

    id = Column(Integer, primary_key=True,
                info={'rdf': QuadMapPatternS(None, ASSEMBL.db_id)})
    extract_id = Column(Integer, ForeignKey(
        Extract.id, ondelete="CASCADE"), nullable=False, index=True)
    xpath_start = Column(String)
    offset_start = Column(Integer)
    xpath_end = Column(String)
    offset_end = Column(Integer)
    extract = relationship(Extract, backref=backref(
        'text_fragment_identifiers', cascade="all, delete-orphan"))

    @classmethod
    def special_quad_patterns(cls, alias_maker, discussion_id):
        return [
            QuadMapPatternS(
                Extract.specific_resource_iri.apply(cls.extract_id),
                OA.hasSelector,
                cls.iri_class().apply(cls.id),
                name=QUADNAMES.oa_hasSelector,
                conditions=(cls.extract_id != None,)),
            QuadMapPatternS(
                None, DCTERMS.conformsTo,
                URIRef("http://tools.ietf.org/rfc/rfc3023")),  # XPointer
            # TODO: add rdf:value for the XPointer. May have to construct within Virtuoso.
            # Optional: Add a OA.exact with the Extract.body. (WHY is the body in the extract?)
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
            return Extract.get(self.extract_id).get_discussion_id()

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return ((cls.extract_id == Extract.id),
                (Extract.discussion_id == discussion_id))

    discussion = relationship(
        Discussion, viewonly=True, uselist=False, secondary=Extract.__table__,
        info={'rdf': QuadMapPatternS(None, ASSEMBL.in_conversation)})

    crud_permissions = CrudPermissions(
            P_ADD_EXTRACT, P_READ, P_EDIT_EXTRACT, P_EDIT_EXTRACT,
            P_EDIT_MY_EXTRACT, P_EDIT_MY_EXTRACT)
