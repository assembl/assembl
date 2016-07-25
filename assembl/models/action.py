"""Records of actions taken by the platform users.

"""

from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    String,
    ForeignKey,
    Integer,
    Unicode,
    DateTime,
    desc,
    select,
    func,
    event,
)
from sqlalchemy.inspection import inspect
from sqlalchemy.orm import relationship, backref, column_property
from virtuoso.vmapping import IriClass

from . import DiscussionBoundBase, DiscussionBoundTombstone, TombstonableMixin
from ..semantic.namespaces import (
    ASSEMBL, QUADNAMES, VERSION, RDF, VirtRDF)
from ..semantic.virtuoso_mapping import QuadMapPatternS
from .auth import User, AgentProfile
from .generic import Content
from .discussion import Discussion
from .idea import Idea
from ..auth import P_READ, P_SYSADMIN, CrudPermissions


class Action(TombstonableMixin, DiscussionBoundBase):
    """
    An action that can be taken by an actor (a :py:class:`.auth.User`).

    Most actions are expressed in terms of actor-verb-target-time,
    with verbs including but not restricted to CRUD operations.
    """
    __tablename__ = 'action'

    id = Column(Integer, primary_key=True)
    type = Column(String(255), nullable=False)
    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow,
        info={'rdf': QuadMapPatternS(None, VERSION.when)})

    __mapper_args__ = {
        'polymorphic_identity': 'action',
        'polymorphic_on': type,
        'with_polymorphic': '*'
    }

    actor_id = Column(
        Integer,
        ForeignKey('user.id', ondelete='CASCADE', onupdate='CASCADE'),
        nullable=False, index=True,
        info={'rdf': QuadMapPatternS(
            None, VERSION.who, AgentProfile.agent_as_account_iri.apply(None))}
    )

    actor = relationship(
        User,
        backref=backref('actions', order_by=creation_date, cascade="all, delete-orphan")
    )

    verb = 'did something to'

    # Because abstract, do in concrete subclasses
    # @classmethod
    # def special_quad_patterns(cls, alias_maker, discussion_id):
    #     return [QuadMapPatternS(None,
    #         RDF.type, IriClass(VirtRDF.QNAME_ID).apply(Action.type),
    #         name=QUADNAMES.class_Action_class)]

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
        nullable=False, index=True,
        info={'rdf': QuadMapPatternS(None, VERSION.what)}
    )


    post_ts = relationship(
        Content, foreign_keys=(post_id,),
        backref=backref("actions_ts", cascade="all, delete-orphan"))

    post = relationship(
        Content,
        primaryjoin="and_(Content.id == ActionOnPost.post_id,"
                         "ActionOnPost.tombstone_date == None)",
        foreign_keys=(post_id,),
        backref=backref('actions', cascade="all, delete-orphan"))

    object_type = 'post'

    def get_discussion_id(self):
        post = self.post or Post.get(self.post_id)
        return post.get_discussion_id()

    @classmethod
    def special_quad_patterns(cls, alias_maker, discussion_id):
        return [QuadMapPatternS(None,
            RDF.type, IriClass(VirtRDF.QNAME_ID_SUFFIX).apply(Action.type),
            name=QUADNAMES.class_ActionOnPost_class)]

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        from .generic import Content
        return ((cls.id == Action.id),
                (cls.post_id == Content.id),
                (Content.discussion_id == discussion_id))

    discussion = relationship(
        Discussion, viewonly=True, secondary=Content.__table__, uselist=False,
        info={'rdf': QuadMapPatternS(None, ASSEMBL.in_conversation)})


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


class ViewPost(UniqueActionOnPost):
    """
    A view action on a post.
    """
    __mapper_args__ = {
        'polymorphic_identity': 'version:ReadStatusChange_P'
    }

    def tombstone(self):
        from .generic import Content
        return DiscussionBoundTombstone(
            self, post=Content.uri_generic(self.post_id),
            actor=User.uri_generic(self.actor_id))

    post_from_view = relationship(
        'Content',
        backref=backref('views'),
    )

    verb = 'viewed'


class LikedPost(UniqueActionOnPost):
    """
    A like action on a post.
    """
    __mapper_args__ = {
        'polymorphic_identity': 'vote:BinaryVote_P'
    }

    def tombstone(self):
        from .generic import Content
        return DiscussionBoundTombstone(
            self, post=Content.uri_generic(self.post_id),
            actor=User.uri_generic(self.actor_id))

    post_from_like = relationship(
        'Content',
        backref=backref('was_liked'),
    )

    verb = 'liked'

    crud_permissions = CrudPermissions(
        P_READ, P_READ, P_SYSADMIN, P_SYSADMIN, P_READ, P_READ, P_READ)


@event.listens_for(LikedPost, 'after_insert', propagate=True)
def send_post_to_socket(mapper, connection, target):
    target.post.send_to_changes()


@event.listens_for(LikedPost, 'after_update', propagate=True)
def send_post_to_socket_ts(mapper, connection, target):
    if not inspect(target).unmodified_intersection(('tombstone_date')):
        target.db.expire(target.post, ['like_count'])
        target.post.send_to_changes()


_lpt = LikedPost.__table__
_actt = Action.__table__
Content.like_count = column_property(
    select([func.count(_actt.c.id)]).where(
        (_lpt.c.id == _actt.c.id)
        & (_lpt.c.post_id == Content.__table__.c.id)
        & (_actt.c.type ==
           LikedPost.__mapper_args__['polymorphic_identity'])
        & (_actt.c.tombstone_date == None)
        ).correlate_except(_actt, _lpt))


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
        nullable=False, index=True,
        info={'rdf': QuadMapPatternS(None, VERSION.what)}
    )

    idea_ts = relationship(
        Idea, foreign_keys=(idea_id,),
        backref=backref("actions_ts", cascade="all, delete-orphan"))

    idea = relationship(
        Idea,
        primaryjoin="and_(Idea.id == ActionOnIdea.idea_id,"
                         "Idea.tombstone_date == None,"
                         "ActionOnIdea.tombstone_date == None)",
        foreign_keys=(idea_id,), backref="actions")

    object_type = 'idea'

    # This should not be necessary, but is.
    @classmethod
    def special_quad_patterns(cls, alias_maker, discussion_id):
        return [QuadMapPatternS(None,
            RDF.type, IriClass(VirtRDF.QNAME_ID_SUFFIX).apply(Action.type),
            name=QUADNAMES.class_ActionOnIdea_class)]

    def get_discussion_id(self):
        idea = self.idea or Idea.get(self.idea_id)
        return idea.get_discussion_id()

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return ((cls.id == Action.id),
                (cls.idea_id == Idea.id),
                (Idea.discussion_id == discussion_id))

    discussion = relationship(
        Discussion, viewonly=True, secondary=Idea.__table__, uselist=False,
        info={'rdf': QuadMapPatternS(None, ASSEMBL.in_conversation)})


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
