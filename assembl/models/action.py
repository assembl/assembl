"""Records of actions taken by the platform users.

"""

from datetime import datetime

from sqlalchemy import (
    Column,
    String,
    ForeignKey,
    Integer,
    DateTime,
    select,
    func,
    event,
)
from sqlalchemy.orm import relationship, backref, column_property
from abc import abstractproperty

from . import DiscussionBoundBase, DiscussionBoundTombstone, TombstonableMixin, Post
from ..lib.sqla import DuplicateHandling
from .auth import User
from .generic import Content
from .discussion import Discussion
from .idea import Idea
from ..auth import P_READ, P_SYSADMIN, CrudPermissions
from ..lib.abc import classproperty


class Action(TombstonableMixin, DiscussionBoundBase):
    """
    An action that can be taken by an actor (a :py:class:`.auth.User`).

    Most actions are expressed in terms of actor-verb-target-time,
    with verbs including but not restricted to CRUD operations.
    """
    __tablename__ = 'action'

    id = Column(Integer, primary_key=True)
    type = Column(String(255), nullable=False)
    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)

    __mapper_args__ = {
        'polymorphic_identity': 'action',
        'polymorphic_on': type,
        'with_polymorphic': '*'
    }

    actor_id = Column(
        Integer,
        ForeignKey('user.id', ondelete='CASCADE', onupdate='CASCADE'),
        nullable=False, index=True
    )

    actor = relationship(
        User,
        backref=backref('actions', order_by=creation_date, cascade="all, delete-orphan")
    )

    verb = 'did something to'

    def __repr__(self):
        return "%s %s %s %s>" % (
            super(Action, self).__repr__()[:-1],
            self.actor.display_name() if self.actor else 'nobody',
            self.verb,
            self.object_type)

    def is_owner(self, user_id):
        return self.actor_id == user_id

    @classmethod
    def restrict_to_owners(cls, q, user_id):
        return q.filter(cls.actor_id == user_id)

    crud_permissions = CrudPermissions(
        P_READ, P_SYSADMIN, P_SYSADMIN, P_SYSADMIN, P_READ, P_READ, P_READ)


class ActionOnDiscussion(Action):
    """An action whose target is a discussion"""
    __tablename__ = 'action_on_discussion'
    id = Column(Integer, ForeignKey(Action.id, ondelete="CASCADE", onupdate='CASCADE'),
                primary_key=True)
    discussion_id = Column(Integer, ForeignKey('discussion.id', ondelete="CASCADE", onupdate="CASCADE"),
                           nullable=False, index=True)

    discussion = relationship(Discussion, foreign_keys=(discussion_id), backref=backref("action_on_discussion", cascade="all"))

    def get_discussion_id(self):
        return self.discussion_id

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return ((cls.id == Action.id),
                (cls.discussion_id == discussion_id))


class AcceptSessionOnDiscussion(ActionOnDiscussion):

    __mapper_args__ = {
        'polymorphic_identity': 'discussion:session:accept'
    }


class AcceptCGUOnDiscussion(ActionOnDiscussion):

    __mapper_args__ = {
        'polymorphic_identity': 'discussion:cgu:accept'
    }


class AcceptTrackingOnDiscussion(ActionOnDiscussion):

    __mapper_args__ = {
        'polymorphic_identity': 'discussion:tracking:accept'
    }


class AcceptPrivacyPolicyOnDiscussion(ActionOnDiscussion):
    __mapper_args__ = {
        'polymorphic_identity': 'discussion:privacypolicy:accept'
    }


class AcceptUserGuidelineOnDiscussion(ActionOnDiscussion):
    __mapper_args__ = {
        'polymorphic_identity': 'discussion:userguideline:accept'
    }


class RejectSessionOnDiscussion(ActionOnDiscussion):

    __mapper_args__ = {
        'polymorphic_identity': 'discussion:session:reject'
    }


class RejectCGUOnDiscussion(ActionOnDiscussion):

    __mapper_args__ = {
        'polymorphic_identity': 'discussion:cgu:reject'
    }


class RejectTrackingOnDiscussion(ActionOnDiscussion):

    __mapper_args__ = {
        'polymorphic_identity': 'discussion:tracking:reject'
    }


class RejectPrivacyPolicyOnDiscussion(ActionOnDiscussion):
    __mapper_args__ = {
        'polymorphic_identity': 'discussion:privacypolicy:reject'
    }


class RejectUserGuidelineOnDiscussion(ActionOnDiscussion):
    __mapper_args__ = {
        'polymorphic_identity': 'discussion:userguideline:reject'
    }


class ActionOnPost(Action):
    """
    An action whose target is a post. (Mixin)
    """
    __tablename__ = 'action_on_post'
    id = Column(
        Integer,
        ForeignKey(Action.id, ondelete="CASCADE", onupdate='CASCADE'),
        primary_key=True
    )

    post_id = Column(
        Integer,
        ForeignKey('content.id', ondelete="CASCADE", onupdate='CASCADE'),
        nullable=False, index=True
    )

    post_ts = relationship(
        Content, foreign_keys=(post_id,),
        backref=backref("actions_ts", cascade="all, delete-orphan"))

    post = relationship(
        Content,
        primaryjoin="and_(Content.id == ActionOnPost.post_id, Content.tombstone_date == None)",
        foreign_keys=(post_id,),
        backref=backref(
            'actions',
            primaryjoin="and_(Content.id == ActionOnPost.post_id, ActionOnPost.tombstone_date == None)",
            cascade="all, delete-orphan"))

    object_type = 'post'

    def get_discussion_id(self):
        post = self.post or Post.get(self.post_id)
        return post.get_discussion_id()

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        from .generic import Content
        return ((cls.id == Action.id),
                (cls.post_id == Content.id),
                (Content.discussion_id == discussion_id))

    discussion = relationship(
        Discussion, viewonly=True, secondary=Content.__table__, uselist=False)


class UniqueActionOnPost(ActionOnPost):
    "An action that should be unique of its subclass for a post, user pair"

    def unique_query(self):
        # inheritance leads in trouble
        query = self.db.query(self.__class__)
        actor_id = self.actor_id or self.actor.id
        post_id = self.post_id or self.post.id
        return query.filter_by(
            actor_id=actor_id, type=self.type, post_id=post_id,
            tombstone_date=self.tombstone_date), True

    def tombstone(self):
        from .generic import Content
        return DiscussionBoundTombstone(
            self, post=Content.uri_generic(self.post_id),
            actor=User.uri_generic(self.actor_id))


class ViewPost(UniqueActionOnPost):
    """
    A view action on a post.
    """
    __mapper_args__ = {
        'polymorphic_identity': 'version:ReadStatusChange_P'
    }

    post_from_view = relationship(
        'Content',
        backref=backref('views'),
    )

    verb = 'viewed'


class SentimentOfPost(UniqueActionOnPost):
    """
    An action of attributing a sentiment to a post.
    """

    __mapper_args__ = {
        'polymorphic_identity': 'sentiment:abstract'
    }

    post_from_sentiments = relationship(
        'Content',
        primaryjoin="and_(Content.id == ActionOnPost.post_id, Content.tombstone_date == None)",
        foreign_keys=(ActionOnPost.post_id,),
        backref=backref(
            'sentiments',
            primaryjoin="and_(Content.id == ActionOnPost.post_id, ActionOnPost.tombstone_date == None)"))

    verb = 'assign_sentiment'
    default_duplicate_handling = DuplicateHandling.TOMBSTONE

    @classproperty
    def all_sentiments(cls):
        return [sub.name for sub in cls.get_subclasses() if sub != cls]

    TYPE_PREFIX_LEN = len('sentiment:')

    crud_permissions = CrudPermissions(
        P_READ, P_READ, P_SYSADMIN, P_SYSADMIN, P_READ, P_READ, P_READ)

    def unique_query(self):
        # Don't use inherited, because no exact type constraint
        # i.e. sentiments are exclusive
        query = self.db.query(SentimentOfPost)
        actor_id = self.actor_id or self.actor.id
        post_id = self.post_id or self.post.id
        return query.filter_by(
            actor_id=actor_id, post_id=post_id,
            tombstone_date=self.tombstone_date), True

    @abstractproperty
    def name(self):
        pass


class LikeSentimentOfPost(SentimentOfPost):
    __mapper_args__ = {
        'polymorphic_identity': 'sentiment:like'
    }

    @classproperty
    def name(cls):
        return 'like'


class DisagreeSentimentOfPost(SentimentOfPost):
    __mapper_args__ = {
        'polymorphic_identity': 'sentiment:disagree'
    }

    @classproperty
    def name(cls):
        return 'disagree'


class DontUnderstandSentimentOfPost(SentimentOfPost):
    __mapper_args__ = {
        'polymorphic_identity': 'sentiment:dont_understand'
    }

    @classproperty
    def name(cls):
        return 'dont_understand'


class MoreInfoSentimentOfPost(SentimentOfPost):
    __mapper_args__ = {
        'polymorphic_identity': 'sentiment:more_info'
    }

    @classproperty
    def name(cls):
        return 'more_info'


@event.listens_for(SentimentOfPost, 'after_insert', propagate=True)
def send_post_to_socket(mapper, connection, target):
    target.post.send_to_changes(view_def="aux_data")
    target.post.send_to_changes(view_def="aux_data_private")


@event.listens_for(SentimentOfPost, 'after_update', propagate=True)
def send_post_to_socket_ts(mapper, connection, target):
    target.post.send_to_changes(view_def="aux_data")
    target.post.send_to_changes(view_def="aux_data_private")


_lpt = LikeSentimentOfPost.__table__
_actt = Action.__table__
Content.like_count = column_property(
    select([func.count(_actt.c.id)]).where(
        (_lpt.c.id == _actt.c.id) &
        (_lpt.c.post_id == Content.__table__.c.id) &
        (_actt.c.type == LikeSentimentOfPost.__mapper_args__['polymorphic_identity']) &
        (_actt.c.tombstone_date == None)  # noqa: E711
        ).correlate_except(_actt, _lpt), deferred=True)


_dpt = DisagreeSentimentOfPost.__table__
_actt2 = Action.__table__
Content.disagree_count = column_property(
    select([func.count(_actt2.c.id)]).where(
        (_dpt.c.id == _actt2.c.id) &
        (_dpt.c.post_id == Content.__table__.c.id) &
        (_actt2.c.type == DisagreeSentimentOfPost.__mapper_args__['polymorphic_identity']) &
        (_actt2.c.tombstone_date == None)  # noqa: E711
        ).correlate_except(_actt2, _dpt), deferred=True)


class ExpandPost(UniqueActionOnPost):
    """
    An expansion action on a post.
    """
    __mapper_args__ = {
        'polymorphic_identity': 'version:ExpandPost_P'
    }

    verb = 'expanded'


class CollapsePost(UniqueActionOnPost):
    """
    A collapse action on a post.
    """
    __mapper_args__ = {
        'polymorphic_identity': 'version:CollapsePost_P'
    }

    verb = 'collapsed'


class ActionOnIdea(Action):
    """
    An action that is taken on an idea. (Mixin)
    """
    __tablename__ = 'action_on_idea'
    id = Column(
        Integer,
        ForeignKey(Action.id, ondelete="CASCADE", onupdate='CASCADE'),
        primary_key=True
    )

    idea_id = Column(
        Integer,
        ForeignKey(Idea.id, ondelete="CASCADE", onupdate='CASCADE'),
        nullable=False, index=True
    )

    idea_ts = relationship(
        Idea, foreign_keys=(idea_id,),
        backref=backref("actions_ts", cascade="all, delete-orphan"))

    idea = relationship(
        Idea,
        primaryjoin="and_(Idea.id == ActionOnIdea.idea_id, Idea.tombstone_date == None)",
        foreign_keys=(idea_id,),
        backref=backref(
            'actions',
            primaryjoin="and_(Idea.id == ActionOnIdea.idea_id, ActionOnIdea.tombstone_date == None)"))
    # TODO: cascade="all, delete-orphan"

    object_type = 'idea'

    def get_discussion_id(self):
        idea = self.idea or Idea.get(self.idea_id)
        return idea.get_discussion_id()

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return ((cls.id == Action.id),
                (cls.idea_id == Idea.id),
                (Idea.discussion_id == discussion_id))

    discussion = relationship(
        Discussion, viewonly=True, secondary=Idea.__table__, uselist=False)


class UniqueActionOnIdea(ActionOnIdea):
    "An action that should be unique of its subclass for an idea, user pair"

    def unique_query(self):
        # inheritance leads in trouble
        query = self.db.query(self.__class__)
        actor_id = self.actor_id or self.actor.id
        idea_id = self.idea_id or self.idea.id
        return query.filter_by(
            actor_id=actor_id, type=self.type, idea_id=idea_id,
            tombstone_date=self.tombstone_date), True


class ViewIdea(ActionOnIdea):
    """
    A view action on an idea. (Not a status)
    """
    __mapper_args__ = {
        'polymorphic_identity': 'version:ReadStatusChange_I'
    }

    def tombstone(self):
        from .generic import Content
        return DiscussionBoundTombstone(
            self, idea=Content.uri_generic(self.idea_id),
            actor=User.uri_generic(self.actor_id))

    verb = 'viewed'
