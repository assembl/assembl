from abc import abstractmethod, ABCMeta
from sqlalchemy.ext.declarative import DeclarativeMeta

from ..lib.abc import abstractclassmethod
from ..lib.sqla import (
    Base, TimestampedBase, get_metadata, get_session_maker,
    get_named_object, get_database_id, Tombstone, UPDATE_OP, DELETE_OP)
from ..lib.history_meta import declare_history_mappers


class DeclarativeAbstractMeta(DeclarativeMeta, ABCMeta):
    pass


class DiscussionBoundBase(Base):
    __metaclass__ = DeclarativeAbstractMeta
    __abstract__ = True

    @abstractmethod
    def get_discussion_id(self):
        "Get the ID of an associated discussion object, if any."
        return self.discussion_id

    def send_to_changes(self, connection=None, operation=UPDATE_OP):
        if not connection:
            # WARNING: invalidate has to be called within an active transaction.
            # This should be the case in general, no need to add a transaction manager.
            connection = self.db().connection()
        if 'cdict' not in connection.info:
            connection.info['cdict'] = {}
        connection.info['cdict'][self.uri()] = (
            self.get_discussion_id(), self)

    @abstractclassmethod
    def get_discussion_condition(cls, discussion_id):
        return cls.discussion_id == discussion_id

    def tombstone(self):
        return DiscussionBoundTombstone(self)


class DiscussionBoundTombstone(Tombstone):
    def __init__(self, ob, **kwargs):
        super(DiscussionBoundTombstone, self).__init__(ob, **kwargs)
        self.discussion_id = ob.get_discussion_id()

    def send_to_changes(self, connection, operation=DELETE_OP):
        assert connection
        if 'cdict' not in connection.info:
            connection.info['cdict'] = {}
        connection.info['cdict'][self.uri] = (
            self.discussion_id, self)


from .auth import (
    AbstractAgentAccount,
    AgentProfile,
    DiscussionPermission,
    EmailAccount,
    IdentityProvider,
    IdentityProviderAccount,
    LocalUserRole,
    PartnerOrganization,
    Permission,
    Role,
    User,
    UserRole,
    Username,
)
from .action import (
    Action,
    ActionOnPost,
    CollapsePost,
    ExpandPost,
    ViewPost,
)
from .discussion import Discussion
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
    Argument,
    Criterion,
    Idea,
    IdeaLink,
    Issue,
    Position,
    RootIdea,
)
from .idea_content_link import (
    Extract,
    Idea,
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
    BinaryIdeaVote,
    LickertIdeaVote,
    LickertRange,
)
from .annotation import (
    Webpage,
)
from .widgets import (
    BaseIdeaWidget,
    BaseIdeaWidgetLink,
    CreativitySessionWidget,
    GeneratedIdeaWidgetLink,
    IdeaCreatingWidget,
    IdeaWidgetLink,
    InspirationWidget,
    MultiCriterionVotingWidget,
    VotableIdeaWidgetLink,
    VotedIdeaWidgetLink,
    VotingCriterionWidgetLink,
    Widget,
    WidgetUserConfig,
)

declare_history_mappers()