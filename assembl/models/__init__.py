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
from ..lib.sqla import Base, Tombstone, CrudOperation


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
            # This should be the case in general, no need to add a transaction
            # manager.
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
            query = query.filter(
                and_(*self.get_discussion_conditions(discussion_id)))
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


# ignore qa because we import this stuff from here
from ..lib.history_mixin import HistoryMixin, TombstonableMixin  # noqa: E402, F401
from ..lib.sqla import get_database_id, get_session_maker, DummyContext, PrivateObjectMixin  # noqa: E402, F401

from .auth import (  # noqa: E402, F401
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
    Username
)
from .configurable_fields import (  # noqa: E402, F401
    AbstractConfigurableField,
    SelectField,
    SelectFieldOption,
    TextField,
    ProfileField,
    ConfigurableFieldIdentifiersEnum
)
from .social_auth import (  # noqa: E402, F401
    Nonce,
    Association,
    Code,
    SocialAuthAccount,
)
from .langstrings import (  # noqa: E402, F401
    Locale,
    LocaleLabel,
    LangString,
    LangStringEntry,
)
from .discussion import Discussion  # noqa: E402, F401
from .user_key_values import (  # noqa: E402, F401
    # AbstractNamespacedKeyValue,
    # AbstractPerUserNamespacedKeyValue,
    DiscussionPerUserNamespacedKeyValue,
    # NamespacedUserKVCollection,
    # UserNsDict,
    UserPreferenceCollection,
)
from .preferences import Preferences  # noqa: E402, F401
from .generic import (  # noqa: E402, F401
    AnnotatorSource,
    Content,
    ContentSource,
    PostSource,
)
from .post import (  # noqa: E402, F401
    AssemblPost,
    ColumnSynthesisPost,
    IdeaProposalPost,
    ImportedPost,
    Post,
    PropositionPost,
    PublicationStates,
    WidgetPost,
    SynthesisPost,
)
from .mail import (  # noqa: E402, F401
    AbstractFilesystemMailbox,
    AbstractMailbox,
    Email,
    IMAPMailbox,
    MaildirMailbox,
    MailingList,
)
from .idea import (  # noqa: E402, F401
    Idea,
    IdeaLink,
    RootIdea,
)
from .thematic import (  # noqa: E402, F401
    Question,
    Thematic,
)
from .idea_msg_columns import (  # noqa: E402, F401
    IdeaMessageColumn,
)
from .action import (  # noqa: E402, F401
    Action,
    ActionOnDiscussion,
    AcceptSessionOnDiscussion,
    AcceptCGUOnDiscussion,
    AcceptTrackingOnDiscussion,
    RejectSessionOnDiscussion,
    RejectCGUOnDiscussion,
    RejectTrackingOnDiscussion,
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
from .idea_content_link import (  # noqa: E402, F401
    Extract,
    ExtractStates,
    ExtractNatureVocabulary,
    ExtractActionVocabulary,
    IdeaContentLink,
    IdeaContentNegativeLink,
    IdeaContentPositiveLink,
    IdeaContentWidgetLink,
    IdeaRelatedPostLink,
    IdeaThreadContextBreakLink,
    TextFragmentIdentifier,
)
from .idea_graph_view import (  # noqa: E402, F401
    ExplicitSubGraphView,
    IdeaGraphView,
    SubGraphIdeaAssociation,
    SubGraphIdeaLinkAssociation,
    Synthesis,
    TableOfContents,
)
from .votes import (  # noqa: E402, F401
    AbstractIdeaVote,
    AbstractVoteSpecification,
    BinaryIdeaVote,
    BinaryVoteSpecification,
    GaugeChoiceSpecification,
    GaugeIdeaVote,
    GaugeVoteSpecification,
    LickertIdeaVote,
    LickertVoteSpecification,
    MultipleChoiceIdeaVote,
    MultipleChoiceVoteSpecification,
    NumberGaugeVoteSpecification,
    TokenCategorySpecification,
    TokenIdeaVote,
    TokenVoteSpecification,
)
from .annotation import (  # noqa: E402, F401
    Webpage,
)
from .timeline import (  # noqa: E402, F401
    DiscussionMilestone,
    DiscussionPhase,
    DiscussionSession,
    Phases,
    TimelineEvent,
)
from .widgets import (  # noqa: E402, F401
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

from .notification import (  # noqa: E402, F401
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

from .feed_parsing import (  # noqa: E402, F401
    FeedPostSource,
    LoomioPostSource,
    FeedPost,
    LoomioFeedPost,
    WebLinkAccount,
    LoomioAccount,
)
from .edgesense_drupal import (  # noqa: E402, F401
    EdgeSenseDrupalSource,
    SourceSpecificAccount,
    SourceSpecificPost,
)
from .facebook_integration import (  # noqa: E402, F401
    FacebookAccessToken,
    FacebookGenericSource,
    FacebookGroupSource,
    FacebookPagePostsSource,
    FacebookPageFeedSource,
    FacebookSinglePostSource,
    FacebookPost
)

from .attachment import (  # noqa: E402, F401
    AttachmentPurpose,
    AgentProfileAttachment,
    DiscussionAttachment,
    Document,
    File,
    Attachment,
    PostAttachment,
    IdeaAttachment,
    ResourceAttachment,
    TimelineEventAttachment,
    VoteSessionAttachment
)

from .announcement import (  # noqa: E402, F401
    Announcement,
    IdeaAnnouncement,
)

from .resource import Resource  # noqa: E402, F401

from .section import Section  # noqa: E402, F401

from .vote_session import VoteSession  # noqa: E402, F401
from .landing_page import LandingPageModuleType, LandingPageModule  # noqa: E402, F401


def includeme(config):
    config.include('.langstrings')
    config.include('.preferences')
