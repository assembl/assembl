"""The basic Content and ContentSource classes.

.. inheritance-diagram:: ContentSource Content PostSource AnnotatorSource assembl.models.post.Post assembl.models.post.AssemblPost assembl.models.post.SynthesisPost assembl.models.post.WidgetPost assembl.models.post.IdeaProposalPost assembl.models.post.ImportedPost assembl.models.mail.AbstractMailbox assembl.models.mail.IMAPMailbox assembl.models.mail.MailingList assembl.models.mail.AbstractFilesystemMailbox assembl.models.mail.MaildirMailbox assembl.models.mail.Email assembl.models.annotation.Webpage
    :parts: 1
"""
from datetime import datetime
import logging
from abc import abstractmethod
import re

from sqlalchemy import (
    Column,
    Integer,
    SmallInteger,
    Boolean,
    UnicodeText,
    String,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship, backref, aliased
from sqlalchemy.sql.functions import count

import assembl.graphql.docstrings as docs
from ..lib.sqla import (CrudOperation, Base)
from ..lib.model_watcher import get_model_watcher
from . import DiscussionBoundBase
from .langstrings import (LangString, LangStringEntry)
from ..auth import (
    CrudPermissions, P_ADD_POST, P_READ, P_ADMIN_DISC, P_EDIT_POST,
    P_EDIT_MY_POST, P_DELETE_POST, P_DELETE_MY_POST)
from ..auth.util import get_current_user_id
from .discussion import Discussion
from ..lib.history_mixin import TombstonableMixin
from ..lib.clean_input import sanitize_text, sanitize_html

log = logging.getLogger('assembl')


class ContentSource(DiscussionBoundBase):
    """
    A ContentSource is where any outside content comes from. .
    """
    __tablename__ = "content_source"
    id = Column(Integer, primary_key=True)
    name = Column(UnicodeText, nullable=False)
    type = Column(String(60), nullable=False)

    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)

    discussion_id = Column(Integer, ForeignKey(
        'discussion.id',
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), nullable=False, index=True)
    connection_error = Column(SmallInteger)
    error_description = Column(String)
    error_backoff_until = Column(DateTime)

    discussion = relationship(
        "Discussion",
        backref=backref(
            'sources', order_by=creation_date,
            cascade="all, delete-orphan"))

    __mapper_args__ = {
        'polymorphic_identity': 'content_source',
        'polymorphic_on': type,
        'with_polymorphic': '*'
    }

    retypeable_as = ("IMAPMailbox", "MailingList", "AbstractMailbox",
                     "AbstractFilesystemMailbox", "AnnotatorSource",
                     "PostSource", "FeedPostSource", "LoomioPostSource",
                     "FacebookGenericSource", "FacebookGroupSource",
                     "FacebookPagePostsSource", "FacebookPageFeedSource",
                     "FacebookSinglePostSource", "EdgeSenseDrupalSource")

    @abstractmethod
    def generate_message_id(self, source_post_id):
        # Generate a globally unique message_id for the post using
        # its source_post_id (locally unique within that source.)
        # In many cases, the source_post_id is already globally unique.
        return source_post_id

    _non_email_chars = re.compile(r'[^!#-\'\*\+\-\./-9=\?A-Z\^_`a-z\|\~]', re.U)

    @classmethod
    def flatten_source_post_id(cls, source_post_id, extra_length=0):
        # Ensure that a source_post_id can be used as part 1 of message_id
        sanitized = cls._non_email_chars.subn(
            lambda c: '_' + hex(ord(c.group()))[2:], source_post_id)[0]
        if len(sanitized) + extra_length > 64:
            # 64 is max according to RFC 5322
            # cut it short and add a digest of original
            import hashlib
            import base64
            d = hashlib.md5()
            d.update(source_post_id)
            d = base64.urlsafe_b64encode(d.digest())
            sanitized = sanitized[
                :max(0, 64 - len(d) - extra_length - 1)]
            if sanitized:
                sanitized += "_" + d
            else:
                sanitized = d
        return sanitized

    def import_content(self, only_new=True):
        from assembl.tasks.source_reader import wake
        wake(self.id, reimport=not only_new)

    def make_reader(self):
        return None

    def get_discussion_id(self):
        return self.discussion_id or self.discussion.id

    @property
    def connection_error_as_text(self):
        from ..tasks.source_reader import ReaderStatus
        return (ReaderStatus(self.connection_error).name
                if self.connection_error is not None else None)

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return (cls.discussion_id == discussion_id,)

    # Cannot be readable to all, because subclasses contain passwords
    crud_permissions = CrudPermissions(P_ADMIN_DISC, P_ADMIN_DISC)

    def reset_errors(self):
        self.connection_error = None
        self.error_description = None
        self.error_backoff_until = None


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

    __mapper_args__ = {
        'polymorphic_identity': 'post_source',
    }

    def get_discussion_id(self):
        return self.discussion_id or self.discussion.id

    def get_default_prepended_id(self):
        # Used for PostSource's whose incoming posts cannot guarantee
        # ImportedPost.source_post_id is unique; in which case, the Post.message_id
        # which is a globally unique value maintain uniqueness integrity
        # by calling this function
        # Must be implemented by subclasses that will not have unique
        # id's on their incoming posts
        return ""

    @property
    def number_of_imported_posts(self):
        from .post import ImportedPost
        return self.db.query(ImportedPost).filter_by(
            source_id=self.id, tombstone_date=None).count()

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return (cls.discussion_id == discussion_id,)

    def send_post(self, post):
        """ Send a new post in the discussion to the source. """
        log.warn(
            "Source %s did not implement PostSource::send_post()"
            % self.__class__.__name__)


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


class ContentSourceIDs(Base):
    """
    A table that keeps track of the number of external identities that
    an Assembl post can be exported to.

    A stepping-stone to having Sinks
    """
    __tablename__ = 'content_source_ids'

    id = Column(Integer, primary_key=True)
    source_id = Column(
        Integer, ForeignKey(
            'content_source.id', onupdate='CASCADE', ondelete='CASCADE'),
        nullable=False, index=True)
    source = relationship('ContentSource', backref=backref(
                          'pushed_messages',
                          cascade='all, delete-orphan'))

    post_id = Column(
        Integer, ForeignKey(
            'content.id', onupdate='CASCADE', ondelete='CASCADE'),
        nullable=False, index=True)
    post = relationship('Content',
                        backref=backref('post_sink_associations',
                                        cascade='all, delete-orphan'))
    message_id_in_source = Column(String(256), nullable=False, index=True)


class Content(TombstonableMixin, DiscussionBoundBase):
    """
    Content is a polymorphic class to describe what is imported from a Source.
    The body and subject properly belong to the Post but were moved here to
    optimize the most common case.
    """
    __tablename__ = "content"
    # __table_cls__ = TableWithTextIndex

    id = Column(Integer, primary_key=True)
    type = Column(String(60), nullable=False)
    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)

    discussion_id = Column(Integer, ForeignKey(
        'discussion.id',
        ondelete='CASCADE',
        onupdate='CASCADE',
    ),
        nullable=False, index=True)

    discussion = relationship(
        "Discussion",
        backref=backref(
            'posts', order_by=creation_date,
            cascade="all, delete-orphan")
    )

    subject_id = Column(Integer, ForeignKey(LangString.id), index=True)
    body_id = Column(Integer, ForeignKey(LangString.id), index=True)
    subject = relationship(
        LangString,
        primaryjoin=subject_id == LangString.id,
        backref=backref("subject_of_post", lazy="dynamic"),
        single_parent=True, lazy="joined",
        cascade="all, delete-orphan")
    body = relationship(
        LangString,
        primaryjoin=body_id == LangString.id,
        backref=backref("body_of_post", lazy="dynamic"),
        single_parent=True, lazy="joined",
        cascade="all, delete-orphan")

    message_classifier = Column(String(100), index=True,
                                doc=docs.PostInterface.message_classifier)

    def __init__(self, *args, **kwargs):
        if (kwargs.get('subject', None) is None and
                kwargs.get('subject_id', None) is None):
            kwargs['subject'] = LangString.EMPTY()
        if (kwargs.get('body', None) is None and
                kwargs.get('body_id', None) is None):
            kwargs['body'] = LangString.EMPTY()
        super(Content, self).__init__(*args, **kwargs)

    @classmethod
    def subqueryload_options(cls):
        # Options for subquery loading. Use when there are many languages in the discussion.
        return (
            LangString.subqueryload_option(cls.subject),
            LangString.subqueryload_option(cls.body))

    @classmethod
    def joinedload_options(cls):
        # Options for joined loading. Use when there are few languages in the discussion.
        return (
            LangString.joinedload_option(cls.subject),
            LangString.joinedload_option(cls.body))

    @classmethod
    def best_locale_query(cls, locales):
        "BUGGY. Return a query that will load the post, best subject and best body for the given locales"
        # this fails because virtuoso, but the SQL is correct.
        # Note that it fails with just body, and succeeds with subject.
        # Go figure. Fortunately not needed yet.
        subject_ls = aliased(LangString)
        body_ls = aliased(LangString)
        best_subject_sq = LangString.best_lang_old(locales)
        best_body_sq = LangString.best_lang_old(locales)

        return cls.default_db.query(
            cls, best_subject_sq, best_body_sq).join(
            subject_ls, cls.subject_id == subject_ls.id).join(
            best_subject_sq).join(
            body_ls, cls.body_id == body_ls.id).join(best_body_sq)

    # TODO: Refactor hidden into PublicationStates.WIDGET_SCOPED
    hidden = Column(Boolean, server_default='0')

    # Another bloody virtuoso bug. Insert with large string fails.
    # body_text_index = TextIndex(body, clusters=[discussion_id])

    __mapper_args__ = {
        'polymorphic_identity': 'content',
        'polymorphic_on': 'type',
        'with_polymorphic': '*'
    }

    def get_created_phase(self):
        from assembl.lib.frontend_urls import get_timeline_for_date
        return get_timeline_for_date(self.discussion, self.creation_date)

    def get_subject(self):
        return self.subject

    def get_body(self):
        return self.body

    def get_title(self):
        return self.subject

    def safe_set_body(self, body):
        if self.get_body_mime_type() == 'text/plain':
            for e in body['entries']:
                e['value'] = sanitize_text(e['value'])
        else:
            for e in body['entries']:
                e['value'] = sanitize_html(e['value'])

    def safe_set_subject(self, subject):
        for e in subject['entries']:
            if "<" in e['value']:
                e['value'] = sanitize_text(e['value'])

    def remove_translations(self):
        if self.subject:
            self.subject.remove_translations()
        self.body.remove_translations()

    def get_body_mime_type(self):
        """ Return the format of the body, so the frontend will know how to
        display it.  Currently, only:
        text/plain (Understood as preformatted text)
        text/html (Undestood as some subset of html)
        """
        return "text/plain"

    def get_body_as_html(self):
        mimetype = self.get_body_mime_type()
        body = self.body
        if not body:
            return None
        if mimetype == 'text/html':
            return body
        elif mimetype == "text/plain":
            ls = LangString()
            for e in body.entries:
                LangStringEntry(
                    value='<span style="white-space: pre-wrap">%s</div>' % (
                        e.value,),
                    langstring=ls, locale_id=e.locale_id)
            return ls
        else:
            log.error("What is this mimetype?" + mimetype)
            return body

    def get_original_body_as_html(self):
        mimetype = self.get_body_mime_type()
        body = self.body
        if not body:
            return None
        if mimetype == 'text/html':
            return body.first_original().value
        elif mimetype == "text/plain":
            return '<span style="white-space: pre-wrap">%s</div>' % (
                body.first_original().value,)
        else:
            log.error("What is this mimetype?" + mimetype)
            return body

    def get_original_body_as_text(self):
        mimetype = self.get_body_mime_type()
        body = self.body
        if not body:
            return ''
        body = body.first_original().value or ''
        if mimetype == 'text/plain':
            return body
        elif mimetype == 'text/html':
            return sanitize_text(body)
        else:
            log.error("What is this mimetype?" + mimetype)
            return body

    def has_attachments(self):
        return self.attachments or False

    def get_attachments_as_html_list(self):
        img_style = "margin: 15px 0 15px 0; max-width: 500px; max-height: auto;"
        img_source = "<a href='%s' target='_blank' style='%s'><img src='%s'></img></a>"
        other_source = "<a href='%s' target='_blank'>%s</a>"
        attachments = self.attachments
        attachment_sorted = sorted(attachments, key=lambda a: a.document.type)
        output = []
        for attachment in attachment_sorted:
            document = attachment.document
            mime_type = document.mime_type
            if mime_type and 'image' in mime_type:
                output.append(img_source % (document.external_url, img_style,
                                            document.external_url))
            else:
                title = document.title or document.external_url
                output.append(other_source % (document.external_url, title))
        return output

    def get_body_as_text(self):
        mimetype = self.get_body_mime_type()
        body = self.body
        if not body:
            return None
        if mimetype == 'text/plain':
            return body
        elif mimetype == 'text/html':
            ls = LangString()
            for e in body.entries:
                LangStringEntry(
                    value=sanitize_text(e.value),
                    langstring=ls, locale_id=e.locale_id)
            return ls
        else:
            log.error("What is this mimetype?" + mimetype)
            return body

    def maybe_translate(self, pref_collection):
        from assembl.tasks.translate import (
            translate_content, PrefCollectionTranslationTable)
        service = self.discussion.translation_service()
        if service.canTranslate is not None:
            translations = PrefCollectionTranslationTable(
                service, pref_collection)
            translate_content(
                self, translation_table=translations, service=service)

    def send_to_changes(self, connection=None, operation=CrudOperation.UPDATE,
                        discussion_id=None, view_def="changes"):
        """invoke the modelWatcher on creation"""
        super(Content, self).send_to_changes(
            connection, operation, discussion_id, view_def)
        watcher = get_model_watcher()
        if operation == CrudOperation.CREATE:
            watcher.processPostCreated(self.id)

    def get_discussion_id(self):
        return self.discussion_id or self.discussion.id

    @property
    def exported_to_sources(self):
        return [ContentSource.uri_generic(s.source_id)
                for s in self.post_sink_associations]

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return (cls.discussion_id == discussion_id,)

    @property
    def sentiment_counts(self):
        from .action import SentimentOfPost
        base = {
            name: 0 for name in SentimentOfPost.all_sentiments
        }
        r = self.db.query(
            SentimentOfPost.type, count(SentimentOfPost.id)
            ).filter(SentimentOfPost.post_id == self.id,
                     SentimentOfPost.tombstone_condition()
            ).group_by(SentimentOfPost.type)
        base.update({k[SentimentOfPost.TYPE_PREFIX_LEN:]: v for (k, v) in r})
        return base

    def current_user(self):
        # HACK! Allows to get the current user's uri from view_defs.
        from .auth import User
        user_id = get_current_user_id()
        return User.uri_generic(user_id)

    def language_priors(self, translation_service):
        discussion = self.discussion
        discussion_locales = discussion.discussion_locales
        return {translation_service.asKnownLocale(loc): 1
                for loc in discussion_locales}

    def guess_languages(self):
        from .langstrings import Locale
        if self.discussion is None:
            self.discussion = Discussion.get(self.discussion_id)
        assert self.discussion
        ts = self.discussion.translation_service()
        priors = self.language_priors(ts)
        if self.body:
            body_original = self.body.first_original()
            ts.confirm_locale(body_original, priors)
        if self.subject:
            if self.body and body_original.locale_code not in (
                    Locale.UNDEFINED, Locale.NON_LINGUISTIC):
                # boost the body's language
                priors = {k: v * 0.6 for (k, v) in priors.iteritems()}
                priors[body_original.locale_code] = 1
            subject_original = self.subject.first_original()
            ts.confirm_locale(subject_original, priors)

    @property
    def my_sentiment(self):
        # Use only within request
        from .action import SentimentOfPost
        user_id = get_current_user_id()
        if user_id is None:
            return
        return self.db.query(SentimentOfPost).filter_by(
            actor_id=user_id, post_id=self.id, tombstone_date=None).first()

    widget_idea_links = relationship('IdeaContentWidgetLink')

    def indirect_idea_content_links(self):
        return []

    def widget_ideas(self):
        from .idea import Idea
        return [Idea.uri_generic(wil.idea_id) for wil in self.widget_idea_links]

    crud_permissions = CrudPermissions(
        P_ADD_POST, P_READ, P_EDIT_POST, P_DELETE_POST,
        P_EDIT_MY_POST, P_DELETE_MY_POST)


LangString.setup_ownership_load_event(Content, ['subject', 'body'])
