from abc import abstractmethod, ABCMeta
from sqlalchemy.ext.declarative import DeclarativeMeta

from ..lib.abc import abstractclassmethod
from ..lib.sqla import (
    Base, TimestampedBase, get_metadata, get_session_maker,
    get_named_object, get_database_id, Tombstone)


class DeclarativeAbstractMeta(DeclarativeMeta, ABCMeta):
    pass


class DiscussionBoundBase(Base):
    __metaclass__ = DeclarativeAbstractMeta
    __abstract__ = True
    @abstractmethod
    def get_discussion_id(self):
        "Get the ID of an associated discussion object, if any."
        return self.discussion_id

    def send_to_changes(self, connection=None):
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
    def __init__(self, ob):
        super(DiscussionBoundTombstone, self).__init__(ob)
        self.discussion_id = ob.get_discussion_id()

    def send_to_changes(self, connection):
        assert connection
        if 'cdict' not in connection.info:
            connection.info['cdict'] = {}
        connection.info['cdict'][self.uri] = (
            self.discussion_id, self)


from .auth import (
    IdentityProvider,
    EmailAccount,
    AbstractAgentAccount,
    IdentityProviderAccount,
    AgentProfile,
    User,
    Username,
    Action,
    Role,
    Permission,
    DiscussionPermission,
    UserRole,
    LocalUserRole,
    ViewPost,
    ExpandPost,
    CollapsePost,
)
from .generic import (
    ContentSource,
    PostSource,
    AnnotatorSource,
    Content,
)
from .post import (
    Post,
    AssemblPost,
    SynthesisPost,
    ImportedPost,
)
from .mail import (
    IMAPMailbox,
    MaildirMailbox,
    MailingList,
    Email,
)
from .synthesis import (
    Discussion,
    TableOfContents,
    Idea,
    RootIdea,
    IdeaLink,
    IdeaRelatedPostLink,
    IdeaContentWidgetLink,
    Extract,
    IdeaGraphView,
    SubGraphIdeaAssociation,
    SubGraphIdeaLinkAssociation,
    ExplicitSubGraphView,
    Synthesis,
    TextFragmentIdentifier,
)
from .annotation import (
    Webpage,
)
from .widgets import (Widget, WidgetUserConfig)
