"""
The SQLAlchemy_ models of Assembl.

The base class of all models is Base, derived from :py:class:`assembl.lib.sqla.BaseOps`.
Here, we also define some other base-level classes, such as :py:class:`DiscussionBoundBase` and :py:class:`DiscussionBoundTombstone`.

.. figure:: ../er_diagram.svg
    :width: 100%
    :target: ../_images/er_diagram.svg

    Entity-relation diagram

.. _SQLAlchemy: http://www.sqlalchemy.org/
"""

from abc import abstractmethod, ABCMeta

from sqlalchemy import and_
from sqlalchemy.ext.declarative import DeclarativeMeta

from ..lib.abc import abstractclassmethod
from ..lib.sqla import (
    Base, TimestampedBase, get_metadata, get_session_maker, PrivateObjectMixin,
    get_named_object, get_database_id, Tombstone, CrudOperation,
    DummyContext)
from ..lib.history_mixin import TombstonableMixin, HistoryMixin


class DeclarativeAbstractMeta(DeclarativeMeta, ABCMeta):
    "Allows to declare abstract SQLAlchemy classes"
    pass


class DiscussionBoundBase(Base):
    """Base class for models that are bound to a specific discussion.

    These models will deleted if the discussion is deleted.
    They need to have a relationship to the discussion, but this relationship
    need not be direct. Subclasses need to define :py:meth:`get_discussion_id`
    and :py:meth:`get_discussion_conditions`.
    """
    __metaclass__ = DeclarativeAbstractMeta
    __abstract__ = True

    @abstractmethod
    def get_discussion_id(self):
        "Get the ID of an associated discussion object, if any."
        return self.discussion_id or self.discussion.id

    def send_to_changes(self, connection=None, operation=CrudOperation.UPDATE,
                        discussion_id=None, view_def="changes"):
        if not connection:
            # WARNING: invalidate has to be called within an active transaction.
            # This should be the case in general, no need to add a transaction manager.
            connection = self.db.connection()
        if 'cdict' not in connection.info:
            connection.info['cdict'] = {}
        connection.info['cdict'][(self.uri(), view_def)] = (
            discussion_id or self.get_discussion_id(), self)

    @abstractclassmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        "Returns a list of SQLA expressions that constrain a query on this class to a given discussion."
        return (cls.discussion_id == discussion_id, )

    def unique_query(self):
        query, usable = super(DiscussionBoundBase, self).unique_query()
        discussion_id = self.get_discussion_id()
        if discussion_id:
            query = query.filter(and_(*self.get_discussion_conditions(discussion_id)))
        return (query, usable)

    def tombstone(self):
        return DiscussionBoundTombstone(self)


class DiscussionBoundTombstone(Tombstone):
    "A :py:class:`assembl.lib.sqla.Tombstone` that is bound to a discussion"
    def __init__(self, ob, **kwargs):
        super(DiscussionBoundTombstone, self).__init__(ob, **kwargs)
        self.discussion_id = ob.get_discussion_id()

    def send_to_changes(self, connection, operation=CrudOperation.DELETE,
                        discussion_id=None, view_def="changes"):
        assert connection
        if 'cdict' not in connection.info:
            connection.info['cdict'] = {}
        connection.info['cdict'][(self.uri, view_def)] = (
            discussion_id or self.discussion_id, self)


class NamedClassMixin(object):
    """A mix-in for models that have a unique name"""
    @abstractclassmethod
    def get_naming_column_name(self):
        return "name"

    @classmethod
    def getByName(cls, name, session=None, query=None):
        session = session or cls.default_db
        query = query or session.query(cls)
        return query.filter_by(**{cls.get_naming_column_name(): name}).first()


from .auth import (
    AbstractAgentAccount,
    AgentProfile,
    AgentStatusInDiscussion,
    AnonymousUser,
    DiscussionPermission,
    EmailAccount,
    IdentityProvider,
    LanguagePreferenceCollection,
    LocalUserRole,
    PartnerOrganization,
    Permission,
    Role,
    User,
    UserLanguagePreference,
    UserRole,
    UserTemplate,
    Username,
)
from .social_auth import (
    Nonce,
    Association,
    Code,
    SocialAuthAccount,
)
from .langstrings import (
    Locale,
    LocaleLabel,
    LangString,
    LangStringEntry,
)
from .discussion import Discussion
from .user_key_values import (
    # AbstractNamespacedKeyValue,
    # AbstractPerUserNamespacedKeyValue,
    DiscussionPerUserNamespacedKeyValue,
    # NamespacedUserKVCollection,
    # UserNsDict,
    UserPreferenceCollection,
)
from .preferences import Preferences
from .generic import (
    AnnotatorSource,
    Content,
    ContentSource,
    PostSource,
)
from .post import (
    AssemblPost,
    IdeaProposalPost,
    ImportedPost,
    Post,
    PropositionPost,
    PublicationStates,
    WidgetPost,
    SynthesisPost,
)
from .mail import (
    AbstractFilesystemMailbox,
    AbstractMailbox,
    Email,
    IMAPMailbox,
    MaildirMailbox,
    MailingList,
)
from .idea import (
    Idea,
    IdeaLink,
    RootIdea,
)
from .thematic import (
    Question,
    Thematic,
)
from .idea_msg_columns import (
    IdeaMessageColumn,
)
from .action import (
    Action,
    ActionOnIdea,
    ActionOnPost,
    CollapsePost,
    ExpandPost,
    SentimentOfPost,
    LikeSentimentOfPost,
    DisagreeSentimentOfPost,
    DontUnderstandSentimentOfPost,
    MoreInfoSentimentOfPost,
    UniqueActionOnIdea,
    UniqueActionOnPost,
    ViewIdea,
    ViewPost,
)
from .idea_content_link import (
    Extract,
    IdeaContentLink,
    IdeaContentNegativeLink,
    IdeaContentPositiveLink,
    IdeaContentWidgetLink,
    IdeaRelatedPostLink,
    IdeaThreadContextBreakLink,
    TextFragmentIdentifier,
)
from .idea_graph_view import (
    ExplicitSubGraphView,
    IdeaGraphView,
    SubGraphIdeaAssociation,
    SubGraphIdeaLinkAssociation,
    Synthesis,
    TableOfContents,
)
from .votes import (
    AbstractIdeaVote,
    AbstractVoteSpecification,
    BinaryIdeaVote,
    BinaryVoteSpecification,
    LickertIdeaVote,
    LickertVoteSpecification,
    MultipleChoiceIdeaVote,
    MultipleChoiceVoteSpecification,
    TokenCategorySpecification,
    TokenIdeaVote,
    TokenVoteSpecification,
)
from .annotation import (
    Webpage,
)
from .timeline import (
    DiscussionMilestone,
    DiscussionPhase,
    DiscussionSession,
    TimelineEvent,
)
from .widgets import (
    BaseIdeaWidget,
    BaseIdeaWidgetLink,
    CreativitySessionWidget,
    GeneratedIdeaWidgetLink,
    IdeaCreatingWidget,
    IdeaCreativitySessionWidgetLink,
    IdeaDescendantsShowingWidgetLink,
    IdeaInspireMeWidgetLink,
    IdeaShowingWidgetLink,
    IdeaWidgetLink,
    InspirationWidget,
    MultiCriterionVotingWidget,
    TokenVotingWidget,
    VotableIdeaWidgetLink,
    VotedIdeaWidgetLink,
    VotingCriterionWidgetLink,
    VotingWidget,
    Widget,
    WidgetUserConfig,
)

from .notification import (
    NotificationSubscription,
    NotificationSubscriptionGlobal,
    NotificationSubscriptionOnPost,
    NotificationSubscriptionOnIdea,
    NotificationSubscriptionOnExtract,
    NotificationSubscriptionOnUserAccount,
    NotificationSubscriptionFollowSyntheses,
    NotificationSubscriptionFollowAllMessages,
    NotificationSubscriptionFollowOwnMessageDirectReplies,
    NotificationSubscriptionStatus,
    Notification,
    NotificationCreationOrigin,
    NotificationDeliveryStateType,
    NotificationOnPost,
    NotificationOnPostCreated,
)

from .feed_parsing import (
    FeedPostSource,
    LoomioPostSource,
    FeedPost,
    LoomioFeedPost,
    WebLinkAccount,
    LoomioAccount,
)
from .edgesense_drupal import (
    EdgeSenseDrupalSource,
    SourceSpecificAccount,
    SourceSpecificPost,
)
from .facebook_integration import (
    FacebookAccessToken,
    FacebookGenericSource,
    FacebookGroupSource,
    FacebookPagePostsSource,
    FacebookPageFeedSource,
    FacebookSinglePostSource,
    FacebookPost
)

from .attachment import (
    DiscussionAttachment,
    Document,
    File,
    Attachment,
    PostAttachment,
    IdeaAttachment,
    ResourceAttachment
)

from .announcement import (
    Announcement,
    IdeaAnnouncement,
)

from .resource import Resource


def includeme(config):
    config.include('.langstrings')
    config.include('.preferences')
