from abc import abstractmethod, ABCMeta

from sqlalchemy import and_
from sqlalchemy.ext.declarative import DeclarativeMeta

from ..lib.abc import abstractclassmethod
from ..lib.sqla import (
    Base, TimestampedBase, get_metadata, get_session_maker, PrivateObjectMixin,
    get_named_object, get_database_id, Tombstone, UPDATE_OP, DELETE_OP,
    DummyContext)
from ..lib.history_mixin import TombstonableMixin, HistoryMixin


class DeclarativeAbstractMeta(DeclarativeMeta, ABCMeta):
    pass


class DiscussionBoundBase(Base):
    __metaclass__ = DeclarativeAbstractMeta
    __abstract__ = True

    @abstractmethod
    def get_discussion_id(self):
        "Get the ID of an associated discussion object, if any."
        return self.discussion_id or self.discussion.id

    def send_to_changes(self, connection=None, operation=UPDATE_OP,
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
    def __init__(self, ob, **kwargs):
        super(DiscussionBoundTombstone, self).__init__(ob, **kwargs)
        self.discussion_id = ob.get_discussion_id()

    def send_to_changes(self, connection, operation=DELETE_OP,
                        discussion_id=None, view_def="changes"):
        assert connection
        if 'cdict' not in connection.info:
            connection.info['cdict'] = {}
        connection.info['cdict'][(self.uri, view_def)] = (
            discussion_id or self.discussion_id, self)


from .auth import (
    AbstractAgentAccount,
    AgentProfile,
    AgentStatusInDiscussion,
    AnonymousUser,
    DiscussionPermission,
    EmailAccount,
    IdentityProvider,
    IdentityProviderAccount,
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
from .langstrings import (
    Locale,
    LocaleName,
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
from .action import (
    Action,
    ActionOnPost,
    CollapsePost,
    ExpandPost,
    LikedPost,
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
    LickertRange,
    LickertVoteSpecification,
    MultipleChoiceIdeaVote,
    MultipleChoiceVoteSpecification,
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
    VotableIdeaWidgetLink,
    VotedIdeaWidgetLink,
    VotingCriterionWidgetLink,
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
    FacebookAccount,
    FacebookAccessToken,
    FacebookGenericSource,
    FacebookGroupSource,
    FacebookPagePostsSource,
    FacebookPageFeedSource,
    FacebookSinglePostSource,
    FacebookPost
)

from .attachment import (
    Document,
    Attachment
)

from .announcement import (
    IdeaAnnouncement
)


def includeme(config):
    config.include('.langstrings')
