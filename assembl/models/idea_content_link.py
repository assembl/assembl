# -*- coding: utf-8 -*-
"""Links between :py:class:`assembl.models.idea.Idea` and :py:class:`assembl.models.generic.Content`."""
import re
import quopri
from datetime import datetime
from enum import Enum

import assembl.graphql.docstrings as docs
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
    Enum as SAEnum
)

from . import DiscussionBoundBase
from ..lib.sqla import CrudOperation
from ..lib.model_watcher import get_model_watcher
from ..lib.clean_input import sanitize_html
from ..lib.locale import to_posix_string
from ..lib.utils import get_hash
from .discussion import Discussion
from .idea import Idea
from .generic import Content
from .post import Post
from .vocabulary import AbstractEnumVocabulary
from ..auth import (
    CrudPermissions, P_READ, P_EDIT_IDEA,
    P_EDIT_EXTRACT, P_ADD_IDEA, P_ADD_EXTRACT,
    P_EDIT_MY_EXTRACT)
from .langstrings import Locale


class IdeaContentLink(DiscussionBoundBase):
    """
    Abstract class representing a generic link between an idea and a Content
    (typically a Post)
    """
    __tablename__ = 'idea_content_link'
    # TODO: How to express the implied link as RDF? Remember not reified, unless extract.

    id = Column(Integer, primary_key=True)
    type = Column(String(60))

    # This is nullable, because in the case of extracts, the idea can be
    # attached later.
    idea_id = Column(Integer, ForeignKey(Idea.id, ondelete="CASCADE", onupdate="CASCADE"),
                     nullable=True, index=True)
    idea = relationship(Idea, active_history=True)

    content_id = Column(Integer, ForeignKey(
        'content.id', ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False, index=True)
    content = relationship(Content, backref=backref(
        'idea_links_of_content', cascade="all, delete-orphan"))

    order = Column(Float, nullable=False, default=0.0)

    creation_date = Column(
        DateTime, nullable=False, default=datetime.utcnow)

    creator_id = Column(
        Integer,
        ForeignKey('agent_profile.id'),
        nullable=False
    )

    creator = relationship(
        'AgentProfile', foreign_keys=[creator_id], backref=backref(
            'extracts_created', cascade="all"))  # do not delete orphan

    __mapper_args__ = {
        'polymorphic_identity': 'assembl:relatedToIdea',
        'polymorphic_on': type,
        'with_polymorphic': '*'
    }

    def get_discussion_id(self):
        content = self.content or Content.get(self.content_id)
        return content.get_discussion_id()

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return ((cls.content_id == Content.id),
                (Content.discussion_id == discussion_id))

    discussion = relationship(
        Discussion, viewonly=True, uselist=False, secondary=Content.__table__)

    @classmethod
    def base_conditions(cls, alias=None, alias_maker=None):
        if alias_maker is None:
            idea_content_link = alias or cls
            idea = Idea
        else:
            idea_content_link = alias or alias_maker.alias_from_class(cls)
            idea = alias_maker.alias_from_relns(idea_content_link.idea)
        return ((idea_content_link.idea_id != None),  # noqa: E711
                (idea.tombstone_date == None))

    crud_permissions = CrudPermissions(P_ADD_IDEA, P_READ, P_EDIT_IDEA, P_EDIT_IDEA, P_EDIT_IDEA, P_EDIT_IDEA)


@event.listens_for(IdeaContentLink.idea, 'set', propagate=True, active_history=True)
def idea_content_link_idea_set_listener(target, value, oldvalue, initiator):
    """When an extract changes ideas, send the ideas on the socket."""
    # print "idea_content_link_idea_set_listener for target: %s set to %s, was %s" % (target, value, oldvalue)
    if oldvalue is not None and oldvalue.id:
        with oldvalue.db.no_autoflush:
            oldvalue.send_to_changes()
            for ancestor in oldvalue.get_all_ancestors():
                ancestor.send_to_changes()
    if value is not None and value.id:
        with value.db.no_autoflush:
            value.send_to_changes()
            for ancestor in value.get_all_ancestors():
                ancestor.send_to_changes()


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

    __mapper_args__ = {
        'polymorphic_identity': 'assembl:postLinkedToIdea_abstract',
    }


class IdeaContentWidgetLink(IdeaContentPositiveLink):
    """
    A link between an idea and a Content limited to a widget view.
    Such links should be traversed.
    """
    __tablename__ = 'idea_content_widget_link'

    id = Column(Integer, ForeignKey(
        'idea_content_positive_link.id',
        ondelete='CASCADE', onupdate='CASCADE'
    ), primary_key=True)

    __mapper_args__ = {
        'polymorphic_identity': 'assembl:postHiddenLinkedToIdea',
    }


Idea.widget_owned_contents = relationship(IdeaContentWidgetLink)
Content.widget_idea_links = relationship(
    IdeaContentWidgetLink, cascade="all, delete-orphan")


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

    __mapper_args__ = {
        'polymorphic_identity': 'assembl:postLinkedToIdea',
    }


class ExtractNatureVocabulary(AbstractEnumVocabulary):
    __tablename__ = "extract_nature"

    class Enum(Enum):
        issue = 1
        actionable_solution = 2
        knowledge = 3
        example = 4
        concept = 5
        argument = 6
        cognitive_bias = 7

    _initial_names = {
        Enum.issue: {
            "en": "Issue",
            "fr": "Problématique",
            },
        Enum.actionable_solution: {
            "en": "actionable solution",
            "fr": "Solution actionnable",
            },
        Enum.knowledge: {
            "en": "knowledge",
            "fr": "Connaissance",
            },
        Enum.example: {
            "en": "example",
            "fr": "Exemple",
            },
        Enum.concept: {
            "en": "concept",
            "fr": "Concept",
            },
        Enum.argument: {
            "en": "argument",
            "fr": "Argument",
            },
        Enum.cognitive_bias: {
            "en": "Cognitive bias",
            "fr": "Biais cognitif",
            },
    }

# Note: Do not call setup_ownership_load_event, as the IDs are not integers.
# LangString.setup_ownership_load_event(ExtractNatureVocabulary, ['name'])


class ExtractActionVocabulary(AbstractEnumVocabulary):
    __tablename__ = "extract_action"

    class Enum(Enum):
        classify = 1
        make_generic = 2
        argument = 3
        give_examples = 4
        more_specific = 5
        mix_match = 6
        display_multi_column = 7
        display_thread = 8
        display_tokens = 9
        display_open_questions = 10
        display_bright_mirror = 11

    _initial_names = {
        Enum.classify: {
            "fr": "Ranger",
            "en": "Classify",
        },
        Enum.make_generic: {
            "fr": "Rendre plus générique",
            "en": "Make generic",
        },
        Enum.argument: {
            "fr": "Argumenter",
            "en": "Argument",
        },
        Enum.give_examples: {
            "fr": "Donner des exemples",
            "en": "Give examples",
        },
        Enum.more_specific: {
            "fr": "Rendre plus opérationnel",
            "en": "Be more specific",
        },
        Enum.mix_match: {
            "fr": "Croiser avec un autre extrait",
            "en": "Mix & match",
        },
        Enum.display_multi_column: {
            "fr": "Activer multi-col.",
            "en": "Display Multi-column",
        },
        Enum.display_thread: {
            "fr": "Activer Thread",
            "en": "Display Thread",
        },
        Enum.display_tokens: {
            "fr": "Activer Tokens",
            "en": "Display tokens",
        },
        Enum.display_open_questions: {
            "fr": "Activer Q° ouvertes",
            "en": "Display Open questions",
        },
        Enum.display_bright_mirror: {
            "fr": "Activer Design Fiction",
            "en": "Display Design Fiction"
        },
    }

# Note: Do not call setup_ownership_load_event, as the IDs are not integers.
# LangString.setup_ownership_load_event(ExtractActionVocabulary, ['name'])


# Those states lists need to be kept in sync with frontend code
# static2/js/app/constants.js
class ExtractStates(Enum):

    SUBMITTED = "SUBMITTED"  # For the Bigdatext (a machine user)
    PUBLISHED = "PUBLISHED"  # For the human catcher


extract_states_identifiers = [t.value for t in ExtractStates.__members__.values()]


class Extract(IdeaContentPositiveLink):
    """
    An extracted part of a Content. A quotation to be referenced by an `Idea`.
    """
    __tablename__ = 'extract'

    id = Column(
        Integer,
        ForeignKey('idea_content_positive_link.id', ondelete='CASCADE', onupdate='CASCADE'),
        primary_key=True)

    # TODO: body was misused to contain the extract fragment content,
    # which should belong in the TextFragmentIdentifier,
    # whereas it was meant to be a comment on the extract
    # if used from the Web annotator. It seems like a fait accompli now.
    body = Column(UnicodeText, nullable=False, doc=docs.ExtractInterface.body)

    discussion_id = Column(Integer, ForeignKey(
        'discussion.id', ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False, index=True)
    discussion = relationship(
        Discussion, backref=backref('extracts', cascade="all, delete-orphan"))

    important = Column('important', Boolean, server_default='0', doc=docs.ExtractInterface.important)

    locale_id = Column(Integer, ForeignKey('locale.id'))

    locale = relationship(Locale, foreign_keys=[locale_id])

    extract_nature = Column(
        'extract_nature', ExtractNatureVocabulary.pg_enum,
        ForeignKey(ExtractNatureVocabulary.id), doc=docs.ExtractInterface.extract_nature)
    extract_action = Column(
        'extract_action', ExtractActionVocabulary.pg_enum,
        ForeignKey(ExtractActionVocabulary.id), doc=docs.ExtractInterface.extract_action)

    extract_nature_term = relationship(ExtractNatureVocabulary)

    extract_action_term = relationship(ExtractActionVocabulary)

    extract_state = Column(
        SAEnum(*extract_states_identifiers, name='extract_states'),
        nullable=False,
        default=ExtractStates.PUBLISHED.value,
        server_default=ExtractStates.PUBLISHED.value)

    extract_hash = Column(
        String, nullable=False, unique=True)

    @property
    def extract_nature_name(self):
        if self.extract_nature is not None:
            return self.extract_nature.name

    @property
    def extract_action_name(self):
        if self.extract_action is not None:
            return self.extract_action.name

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
        retval = {'@type': self.content.external_typename()}
        if isinstance(self.content, Post):
            retval['@id'] = Post.uri_generic(self.content.id)
        elif self.content.type == 'webpage':
            retval['url'] = self.content.url
        return retval

    @property
    def lang(self):
        if self.locale_id:
            return Locale.code_for_id(self.locale_id)

        return self.locale and self.locale.code

    @lang.setter
    def lang(self, code):
        assert(code)
        posix = to_posix_string(code)
        locale = Locale.get_or_create(posix, self.db)
        self.locale = locale
        self.locale_id = locale.id

    def __repr__(self):
        r = super(Extract, self).__repr__()
        body = self.body or ""
        return r[:-1] + body[:20].encode("ascii", "ignore") + ">"

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
        # dead code? If not needs to be refactored with langstrings
        body = sanitize_html(body, [])
        quote = self.body.replace("\r", "")
        try:
            # for historical reasons
            quote = quopri.decodestring(quote)
        except:
            pass
        quote = sanitize_html(quote, [])
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
        tfi.offset_end = start + len(quote)
        return tfi

    def send_to_changes(self, connection=None, operation=CrudOperation.UPDATE,
                        discussion_id=None, view_def="changes"):
        """invoke the modelWatcher on creation"""
        super(Extract, self).send_to_changes(
            connection, operation, discussion_id, view_def)
        watcher = get_model_watcher()
        if operation == CrudOperation.UPDATE:
            watcher.processExtractModified(self.id, 0)  # no versions yet.
        elif operation == CrudOperation.DELETE:
            watcher.processExtractDeleted(self.id)
        elif operation == CrudOperation.CREATE:
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

    @classmethod
    def get_extract_hash(cls, lang, xpath_start, xpath_end, offset_start, offset_end, post_id):
        "Return a hash for the extract values"
        return get_hash(
            lang,
            xpath_start,
            xpath_end,
            offset_start,
            offset_end,
            post_id
        )

    def update_extract_hash(self):
        tfis = self.text_fragment_identifiers
        tfi = tfis[0] if tfis else None
        self.extract_hash = self.get_extract_hash(
            self.lang,
            getattr(tfi, 'xpath_start', ''),
            getattr(tfi, 'xpath_end', ''),
            getattr(tfi, 'offset_start', ''),
            getattr(tfi, 'offset_end', ''),
            self.content.id
        )

    crud_permissions = CrudPermissions(
        P_ADD_EXTRACT, P_READ, P_EDIT_EXTRACT, P_EDIT_EXTRACT, P_EDIT_MY_EXTRACT, P_EDIT_MY_EXTRACT)


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

    id = Column(Integer, primary_key=True)
    extract_id = Column(Integer, ForeignKey(
        Extract.id, ondelete="CASCADE"), nullable=False, index=True)
    xpath_start = Column(String, doc=docs.TextFragmentIdentifier.xpath_start)
    offset_start = Column(Integer, doc=docs.TextFragmentIdentifier.offset_start)
    xpath_end = Column(String, doc=docs.TextFragmentIdentifier.xpath_end)
    offset_end = Column(Integer, doc=docs.TextFragmentIdentifier.offset_end)
    extract = relationship(Extract, backref=backref(
        'text_fragment_identifiers', cascade="all, delete-orphan"))

    xpath_re = re.compile(
        r'xpointer\(start-point\(string-range\(([^,]+),([^,]+),([^,]+)\)\)'
        r'/range-to\(string-range\(([^,]+),([^,]+),([^,]+)\)\)\)')

    def __string__(self):
        return ("xpointer(start-point(string-range(%s,'',%d))/"
                "range-to(string-range(%s,'',%d)))" % (self.xpath_start, self.offset_start, self.xpath_end, self.offset_end))

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
        extract = self.extract or Extract.get(self.extract_id)
        return extract.get_discussion_id()

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return ((cls.extract_id == Extract.id),
                (Extract.discussion_id == discussion_id))

    discussion = relationship(
        Discussion, viewonly=True, uselist=False, secondary=Extract.__table__)

    crud_permissions = CrudPermissions(
        P_ADD_EXTRACT, P_READ, P_EDIT_EXTRACT, P_EDIT_EXTRACT, P_EDIT_MY_EXTRACT, P_EDIT_MY_EXTRACT)
