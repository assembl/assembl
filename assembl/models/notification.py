# coding=UTF-8
"""Allow users to be notified of certain events happening in a discussion. Depends on subscribing to those events."""
from datetime import datetime
from collections import defaultdict
from abc import abstractmethod
import transaction
import os
from os.path import join, dirname
import email
from email import (charset as Charset)
from email.mime.text import MIMEText
from functools import partial
import threading

from sqlalchemy import (
    Column,
    Integer,
    String,
    UnicodeText,
    DateTime,
    ForeignKey,
    event,
    inspect
)
from sqlalchemy.orm import relationship, backref
from sqlalchemy.orm.exc import DetachedInstanceError
from pyramid.httpexceptions import HTTPUnauthorized, HTTPBadRequest
from pyramid.i18n import TranslationStringFactory, make_localizer
from pyramid_mailer.message import Message
from pyramid.security import Everyone
from jinja2 import Environment, PackageLoader

from . import Base, DiscussionBoundBase
from ..lib.model_watcher import BaseModelEventWatcher
from ..lib.decl_enums import DeclEnum
from ..lib.sqla import get_session_maker
from ..lib.utils import waiting_get
from ..lib import config
from .auth import User, P_ADMIN_DISC, CrudPermissions, P_READ, UserTemplate
from .discussion import Discussion
from .generic import Content
from .post import Post, SynthesisPost
from .auth import UserLanguagePreferenceCollection


_ = TranslationStringFactory('assembl')

# Don't BASE64-encode UTF-8 messages so that we avoid unwanted attention from
# some spam filters.
utf8_charset = Charset.Charset('utf-8')
utf8_charset.body_encoding = None  # Python defaults to BASE64


class SafeMIMEText(MIMEText):
    def __init__(self, text, subtype, charset):
        self.encoding = charset
        if charset == 'utf-8':
            # Unfortunately, Python < 3.5 doesn't support setting a Charset instance
            # as MIMEText init parameter (http://bugs.python.org/issue16324).
            # We do it manually and trigger re-encoding of the payload.
            MIMEText.__init__(self, text, subtype, None)
            del self['Content-Transfer-Encoding']
            self.set_payload(text, utf8_charset)
            self.replace_header('Content-Type', 'text/%s; charset="%s"' % (subtype, charset))
        else:
            MIMEText.__init__(self, text, subtype, charset)


class NotificationSubscriptionClasses(DeclEnum):
    # System notifications (can't unsubscribe)
    EMAIL_BOUNCED = "EMAIL_BOUNCED", "Mandatory"
    EMAIL_VALIDATE = "EMAIL_VALIDATE", "Mandatory"
    RECOVER_ACCOUNT = "RECOVER_ACCOUNT", ""
    RECOVER_PASSWORD = "RECOVER_PASSWORD", ""
    PARTICIPATED_FOR_FIRST_TIME_WELCOME = "PARTICIPATED_FOR_FIRST_TIME_WELCOME", "Mandatory"
    SUBSCRIPTION_WELCOME = "SUBSCRIPTION_WELCOME", "Mandatory"

    # Core notification (unsubscribe strongly discuraged)
    FOLLOW_SYNTHESES = "FOLLOW_SYNTHESES", ""
    FOLLOW_OWN_MESSAGES_DIRECT_REPLIES = "FOLLOW_OWN_MESSAGES_DIRECT_REPLIES", "Mandatory?"
    # Note:  indirect replies are FOLLOW_THREAD_DISCUSSION
    SESSIONS_STARTING = "SESSIONS_STARTING", ""
    # Follow phase changes?
    FOLLOW_IDEA_FAMILY_DISCUSSION = "FOLLOW_IDEA_FAMILY_DISCUSSION", ""
    FOLLOW_IDEA_FAMILY_MEMBERSHIP_CHANGES = "FOLLOW_IDEA_FAMILY_MEMBERSHIP_CHANGES", ""
    FOLLOW_IDEA_FAMILY_SUB_IDEA_SUGGESTIONS = "FOLLOW_IDEA_FAMILY_SUB_IDEA_SUGGESTIONS", ""
    FOLLOW_IDEA_CANONICAL_EXPRESSIONS_CHANGED = "FOLLOW_IDEA_CANONICAL_EXPRESSIONS_CHANGED", "Title or description changed"
    FOLLOW_OWN_MESSAGES_NUGGETS = "FOLLOW_OWN_MESSAGES_NUGGETS", ""
    FOLLOW_ALL_MESSAGES = "FOLLOW_ALL_MESSAGES", "NOT the same as following root idea"
    FOLLOW_ALL_THREAD_NEWLY_PARTICIPATED_IN = "FOLLOW_ALL_THREAD_NEWLY_PARTICIPATED_IN", "Pseudo-notification, that will create new FOLLOW_THREAD_DISCUSSION notifications (so one can unsubscribe)"
    FOLLOW_THREAD_DISCUSSION = "FOLLOW_THREAD_DISCUSSION", ""
    FOLLOW_USER_POSTS = "FOLLOW_USER_POSTS", ""
    USER_JOINS = "USER_JOINS", "User joins discussion"

    # System error notifications
    SYSTEM_ERRORS = "SYSTEM_ERRORS", ""
    # Abstract notification types. Those need not be in the constraint, so no migration.
    ABSTRACT_NOTIFICATION_SUBSCRIPTION = "ABSTRACT_NOTIFICATION_SUBSCRIPTION"
    ABSTRACT_NOTIFICATION_SUBSCRIPTION_ON_DISCUSSION = "ABSTRACT_NOTIFICATION_SUBSCRIPTION_ON_DISCUSSION"
    ABSTRACT_NOTIFICATION_SUBSCRIPTION_ON_OBJECT = "ABSTRACT_NOTIFICATION_SUBSCRIPTION_ON_OBJECT"
    ABSTRACT_NOTIFICATION_SUBSCRIPTION_ON_POST = "ABSTRACT_NOTIFICATION_SUBSCRIPTION_ON_POST"
    ABSTRACT_NOTIFICATION_SUBSCRIPTION_ON_IDEA = "ABSTRACT_NOTIFICATION_SUBSCRIPTION_ON_IDEA"
    ABSTRACT_NOTIFICATION_SUBSCRIPTION_ON_EXTRACT = "ABSTRACT_NOTIFICATION_SUBSCRIPTION_ON_EXTRACT"
    ABSTRACT_NOTIFICATION_SUBSCRIPTION_ON_USERACCOUNT = "ABSTRACT_NOTIFICATION_SUBSCRIPTION_ON_USERACCOUNT"


class NotificationCreationOrigin(DeclEnum):
    USER_REQUESTED = "USER_REQUESTED", "A direct user action created the notification subscription"
    DISCUSSION_DEFAULT = "DISCUSSION_DEFAULT", "The notification subscription was created by the default discussion configuration"
    PARENT_NOTIFICATION = "PARENT_NOTIFICATION", "The notification subscription was created by another subscription (such as following all message threads a user participated in"


class NotificationSubscriptionStatus(DeclEnum):
    ACTIVE = "ACTIVE", "Normal status, subscription will create notifications"
    UNSUBSCRIBED = "UNSUBSCRIBED", "The user explicitely unsubscribed from this notification"
    INACTIVE_DFT = "INACTIVE_DFT", "This subscription is defined in the template, but not subscribed by default."


class NotificationSubscription(DiscussionBoundBase):
    """A subscription to a specific type of notification.

    Subclasses will implement the actual code."""
    __tablename__ = "notification_subscription"
    id = Column(
        Integer,
        primary_key=True)
    type = Column(
        NotificationSubscriptionClasses.db_type(),
        nullable=False,
        index=True)
    discussion_id = Column(
        Integer,
        ForeignKey('discussion.id',
                   ondelete='CASCADE',
                   onupdate='CASCADE'),
        nullable=False,
        index=True,
    )
    discussion = relationship(
        Discussion,
        backref=backref('notificationSubscriptions',
                        cascade="all, delete-orphan")
    )
    creation_date = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow)
    creation_origin = Column(
        NotificationCreationOrigin.db_type(),
        nullable=False)
    parent_subscription_id = Column(
        Integer,
        ForeignKey(
            'notification_subscription.id',
            ondelete='CASCADE',
            onupdate='CASCADE'),
        nullable=True)
    children_subscriptions = relationship(
        "NotificationSubscription",
        foreign_keys=[parent_subscription_id],
        backref=backref('parent_subscription', remote_side=[id]),
    )
    status = Column(
        NotificationSubscriptionStatus.db_type(),
        nullable=False,
        index=True,
        default=NotificationSubscriptionStatus.ACTIVE)
    last_status_change_date = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow)
    user_id = Column(
        Integer,
        ForeignKey(
            'user.id',
            ondelete='CASCADE',
            onupdate='CASCADE'),
        nullable=False,
        index=True)
    user = relationship(
        User,
        backref=backref(
            'notification_subscriptions', order_by=creation_date,
            cascade="all, delete-orphan")
    )

    # allowed_transports Ex: email_bounce cannot be bounced by the same email.  For now we'll special case in code
    priority = 1  # An integer, if more than one subsciption match for one event, only the one with the lowest integer can create a notification
    unsubscribe_allowed = False

    __mapper_args__ = {
        'polymorphic_identity': NotificationSubscriptionClasses.ABSTRACT_NOTIFICATION_SUBSCRIPTION,
        'polymorphic_on': 'type',
        'with_polymorphic': '*'
    }

    def can_merge(self, other):
        return (
            self.discussion_id == other.discussion_id and
            self.type == other.type and
            self.user_id == other.user_id and
            self.parent_subscription_id == other.parent_subscription_id
        )

    def merge(self, other):
        assert self.can_merge(other)
        self.creation_date = min(self.creation_date, other.creation_date)
        if (self.status == NotificationSubscriptionStatus.INACTIVE_DFT or (other.status != NotificationSubscriptionStatus.INACTIVE_DFT and self.last_status_change_date < other.last_status_change_date)):
            self.status = other.status
        self.last_status_change_date = max(
            self.last_status_change_date, other.last_status_change_date)
        for notification in other.notifications:
            notification.first_matching_subscription_id = self.id

    def get_discussion_id(self):
        return self.discussion_id

    def get_language_preferences(self):
        if getattr(self, '_lang_pref', None) is None:
            self._lang_pref = UserLanguagePreferenceCollection(self.user_id)
        return self._lang_pref

    def class_description(self):
        return self.type.description

    @abstractmethod
    def followed_object(self):
        pass

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return (cls.discussion_id == discussion_id,)

    def wouldCreateNotification(self, discussion_id, verb, object):
        return discussion_id == object.get_discussion_id() and self.user.is_participant(discussion_id)

    @classmethod
    def findApplicableInstances(cls, discussion_id, verb, object, user=None):
        """
        Returns all subscriptions that would fire on the object, and verb given

        This naive implementation instanciates every ACTIVE subscription for every user,
        and calls "would fire" for each.  It is expected that most subclasses will
        override this with a more optimal implementation
        """
        applicable_subscriptions = []
        subscriptionsQuery = cls.default_db.query(cls)
        subscriptionsQuery = subscriptionsQuery.filter(cls.status == NotificationSubscriptionStatus.ACTIVE)
        subscriptionsQuery = subscriptionsQuery.filter(cls.discussion_id == discussion_id)
        if user:
            subscriptionsQuery = subscriptionsQuery.filter(cls.user == user)
        # print "findApplicableInstances(called) with discussion_id=%s, verb=%s, object=%s, user=%s"%(discussion_id, verb, object, user)
        # print repr(subscriptionsQuery.all())
        for subscription in subscriptionsQuery:
            if(subscription.wouldCreateNotification(object.get_discussion_id(), verb, object)):
                applicable_subscriptions.append(subscription)
        return applicable_subscriptions

    @abstractmethod
    def process(self, discussion_id, verb, objectInstance, otherApplicableSubscriptions):
        """Process a CRUD event on a model, creating :py:class:`Notification` as appropriate"""
        pass

    def get_human_readable_description(self):
        """ A human readable description of this notification subscription
        Default implementation, expected to be overriden by child classes """
        return self.external_typename()

    def _do_update_from_json(
            self, json, parse_def, aliases, ctx, permissions,
            user_id, duplicate_handling=None, jsonld=None):
        from ..auth.util import user_has_permission
        target_user_id = user_id
        user = ctx.get_instance_of_class(User)
        if user:
            target_user_id = user.id
        if self.user_id:
            if target_user_id != self.user_id:
                if not user_has_permission(self.discussion_id, user_id, P_ADMIN_DISC):
                    raise HTTPUnauthorized()
            # For now, do not allow changing user, it's way too complicated.
            if 'user' in json and User.get_database_id(json['user']) != self.user_id:
                raise HTTPBadRequest()
        else:
            json_user_id = json.get('user', None)
            if json_user_id is None:
                json_user_id = target_user_id
            else:
                json_user_id = User.get_database_id(json_user_id)
                if json_user_id != user_id and not user_has_permission(self.discussion_id, user_id, P_ADMIN_DISC):
                    raise HTTPUnauthorized()
            self.user_id = json_user_id
        if self.discussion_id:
            if 'discussion_id' in json and Discussion.get_database_id(json['discussion_id']) != self.discussion_id:
                raise HTTPBadRequest()
        else:
            discussion_id = json.get('discussion', None) or ctx.get_discussion_id()
            if discussion_id is None:
                raise HTTPBadRequest()
            self.discussion_id = Discussion.get_database_id(discussion_id)
        new_type = json.get('@type', self.type)
        if self.external_typename() != new_type:
            polymap = inspect(self.__class__).polymorphic_identity
            if new_type not in polymap:
                raise HTTPBadRequest()
            new_type = polymap[new_type].class_
            new_instance = self.change_class(new_type)
            return new_instance._do_update_from_json(
                json, parse_def, aliases, ctx, permissions,
                user_id, True, jsonld)
        creation_origin = json.get('creation_origin', "USER_REQUESTED")
        if creation_origin is not None:
            self.creation_origin = NotificationCreationOrigin.from_string(creation_origin)
        if json.get('parent_subscription', None) is not None:
            self.parent_subscription_id = self.get_database_id(json['parent_subscription'])
        status = json.get('status', None)
        if status:
            status = NotificationSubscriptionStatus.from_string(status)
            if status != self.status:
                self.status = status
                self.last_status_change_date = datetime.utcnow()
        return self.handle_duplication(
            json, parse_def, aliases, ctx, permissions, user_id,
            duplicate_handling, jsonld)

    def unique_query(self):
        # documented in lib/sqla
        query, _ = super(NotificationSubscription, self).unique_query()
        user_id = self.user_id or self.user.id
        return query.filter_by(
            user_id=user_id, type=self.type), False

    def is_owner(self, user_id):
        return self.user_id == user_id

    def reset_defaults(self):
        # This notification belongs to a template and was changed;
        # update all users who have the default subscription value.
        # Incomplete: Does not handle subscribed users without NS.
        status = (
            NotificationSubscriptionStatus.INACTIVE_DFT
            if self.status == NotificationSubscriptionStatus.UNSUBSCRIBED
            else self.status)

        self.db.query(self.__class__).filter_by(
            discussion_id=self.discussion_id,
            creation_origin=NotificationCreationOrigin.DISCUSSION_DEFAULT
            ).update(status=status)

    @classmethod
    def restrict_to_owners(cls, query, user_id):
        """Filter query according to object owners.
        Also allow to read subscriptions of templates."""
        # optimize the join on a single table
        utt = inspect(UserTemplate).tables[0]
        # Find the alias for this class with black magic
        alias = None
        for aipaths in query._joinpath.keys():
            for ainsp in aipaths:
                if getattr(ainsp, '_target', None) == cls:
                    alias = ainsp.entity
                    break
            if alias:
                break
        assert alias
        return query.outerjoin(utt, alias.user_id == utt.c.id).filter(
            (cls.user_id == user_id) | (utt.c.id != None))  # noqa: E711

    def user_can(self, user_id, operation, permissions):
        # special case: If you can read the discussion, you can read
        # the template's notification.
        if user_id == Everyone:
            user = None
        else:
            try:
                user = self.user
            except DetachedInstanceError:
                user = User.get(user_id)
        if (operation == CrudPermissions.READ and user and isinstance(user, UserTemplate)):
            return self.discussion.user_can(user_id, operation, permissions)
        return super(NotificationSubscription, self).user_can(
            user_id, operation, permissions)

    crud_permissions = CrudPermissions(
        P_READ, P_ADMIN_DISC, P_ADMIN_DISC, P_ADMIN_DISC,
        P_READ, P_READ, P_READ)


@event.listens_for(NotificationSubscription.status, 'set', propagate=True)
def update_last_status_change_date(target, value, oldvalue, initiator):
    target.last_status_change_date = datetime.utcnow()


@event.listens_for(get_session_maker(), "after_flush")
def after_flush_list(session, flush_context):
    session.assembl_objects_to_check_unique = []
    for obj in session.new | session.dirty:
        if isinstance(obj, NotificationSubscription):
            session.assembl_objects_to_check_unique.append(obj)
    for obj in session.dirty:
        if isinstance(obj, NotificationSubscription) and session.is_modified(obj):
            session.assembl_objects_to_check_unique.append(obj)


@event.listens_for(get_session_maker(), "after_flush_postexec")
def after_flush_check(session, flush_context):
    for obj in session.assembl_objects_to_check_unique:
        obj.assert_unique()
    session.assembl_objects_to_check_unique = []


class NotificationSubscriptionGlobal(NotificationSubscription):
    __mapper_args__ = {
        'polymorphic_identity': NotificationSubscriptionClasses.ABSTRACT_NOTIFICATION_SUBSCRIPTION_ON_DISCUSSION
    }

    def followed_object(self):
        pass

    def unique_query(self):
        query, _ = super(NotificationSubscriptionGlobal, self).unique_query()
        return query, True


class NotificationSubscriptionOnObject(NotificationSubscription):
    __mapper_args__ = {
        'polymorphic_identity': NotificationSubscriptionClasses.ABSTRACT_NOTIFICATION_SUBSCRIPTION_ON_OBJECT
    }

    def followed_object(self):
        pass


class NotificationSubscriptionOnPost(NotificationSubscriptionOnObject):

    __tablename__ = "notification_subscription_on_post"
    __mapper_args__ = {
        'polymorphic_identity': NotificationSubscriptionClasses.ABSTRACT_NOTIFICATION_SUBSCRIPTION_ON_POST
    }

    id = Column(Integer, ForeignKey(
        NotificationSubscription.id,
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    post_id = Column(
        Integer, ForeignKey("post.id",
                            ondelete='CASCADE', onupdate='CASCADE'), nullable=False)

    post = relationship("Post", backref=backref(
        "subscriptions_on_post", cascade="all, delete-orphan"))

    def followed_object(self):
        return self.post

    def can_merge(self, other):
        return (super(NotificationSubscriptionOnPost, self).can_merge(other) and self.post_id == other.post_id)

    def unique_query(self):
        query, _ = super(NotificationSubscriptionOnPost, self).unique_query()
        post_id = self.post_id or self.post.id
        return query.filter_by(post_id=post_id), True

    def _do_update_from_json(
            self, json, parse_def, aliases, ctx, permissions,
            user_id, duplicate_handling=None, jsonld=None):
        updated = super(
            NotificationSubscriptionOnPost, self)._do_update_from_json(
                json, parse_def, aliases, ctx, permissions,
                user_id, duplicate_handling, jsonld)
        if updated == self:
            self.post_id = json.get('post_id', self.post_id)
        return updated


class NotificationSubscriptionOnIdea(NotificationSubscriptionOnObject):

    __tablename__ = "notification_subscription_on_idea"
    __mapper_args__ = {
        'polymorphic_identity': NotificationSubscriptionClasses.ABSTRACT_NOTIFICATION_SUBSCRIPTION_ON_IDEA
    }

    id = Column(Integer, ForeignKey(
        NotificationSubscription.id,
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    idea_id = Column(
        Integer, ForeignKey("idea.id",
                            ondelete='CASCADE', onupdate='CASCADE'),
        nullable=False, index=True)

    idea = relationship("Idea", backref=backref(
        "subscriptions_on_idea", cascade="all, delete-orphan"))

    def followed_object(self):
        return self.idea

    def can_merge(self, other):
        return (super(NotificationSubscriptionOnPost, self).can_merge(other) and self.idea_id == other.idea_id)

    def unique_query(self):
        query, _ = super(NotificationSubscriptionOnIdea, self).unique_query()
        idea_id = self.idea_id or self.idea.id
        return query.filter_by(idea_id=idea_id), True

    def _do_update_from_json(
            self, json, parse_def, aliases, ctx, permissions,
            user_id, duplicate_handling=True, jsonld=None):
        updated = super(
            NotificationSubscriptionOnIdea, self)._do_update_from_json(
                json, parse_def, aliases, ctx, permissions,
                user_id, duplicate_handling, jsonld)
        if updated == self:
            self.idea_id = json.get('idea_id', self.idea_id)
        return updated


class NotificationSubscriptionOnExtract(NotificationSubscriptionOnObject):

    __tablename__ = "notification_subscription_on_extract"
    __mapper_args__ = {
        'polymorphic_identity': NotificationSubscriptionClasses.ABSTRACT_NOTIFICATION_SUBSCRIPTION_ON_EXTRACT
    }

    id = Column(Integer, ForeignKey(
        NotificationSubscription.id,
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), nullable=False, primary_key=True)

    extract_id = Column(
        Integer, ForeignKey("extract.id",
                            ondelete='CASCADE', onupdate='CASCADE'),
        nullable=False, index=True)

    extract = relationship("Extract", backref=backref(
        "subscriptions_on_extract", cascade="all, delete-orphan"))

    def followed_object(self):
        return self.extract

    def can_merge(self, other):
        return (super(NotificationSubscriptionOnPost, self).can_merge(other) and self.extract_id == other.extract_id)

    def unique_query(self):
        query, _ = super(NotificationSubscriptionOnExtract, self).unique_query()
        extract_id = self.extract_id or self.extract.id
        return query.filter_by(extract_id=extract_id), True

    def _do_update_from_json(
            self, json, parse_def, aliases, ctx, permissions,
            user_id, duplicate_handling=True, jsonld=None):
        updated = super(
            NotificationSubscriptionOnExtract, self)._do_update_from_json(
                json, parse_def, aliases, ctx, permissions,
                user_id, duplicate_handling, jsonld)
        if updated == self:
            self.extract_id = json.get('extract_id', self.extract_id)
        return updated


class NotificationSubscriptionOnUserAccount(NotificationSubscriptionOnObject):

    __tablename__ = "notification_subscription_on_useraccount"
    __mapper_args__ = {
        'polymorphic_identity': NotificationSubscriptionClasses.ABSTRACT_NOTIFICATION_SUBSCRIPTION_ON_USERACCOUNT
    }

    id = Column(Integer, ForeignKey(
        NotificationSubscription.id,
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    on_user_id = Column(
        Integer, ForeignKey("user.id",
                            ondelete='CASCADE', onupdate='CASCADE'),
        nullable=False, index=True)

    on_user = relationship("User", foreign_keys=[on_user_id], backref=backref(
        "subscriptions_on_user", cascade="all, delete-orphan"))

    def followed_object(self):
        return self.user

    def can_merge(self, other):
        return (super(NotificationSubscriptionOnPost, self).can_merge(other) and self.on_user_id == other.on_user_id)

    def unique_query(self):
        query, _ = super(NotificationSubscriptionOnUserAccount, self).unique_query()
        on_user_id = self.on_user_id or self.on_user.id
        return query.filter_by(on_user_id=on_user_id), True

    def _do_update_from_json(
            self, json, parse_def, aliases, ctx, permissions,
            user_id, duplicate_handling=True, jsonld=None):
        updated = super(
            NotificationSubscriptionOnUserAccount, self)._do_update_from_json(
                json, parse_def, aliases, ctx, permissions,
                user_id, duplicate_handling, jsonld)
        if updated == self:
            self.on_user_id = json.get('on_user_id', self.on_user_id)
        return updated


class CrudVerbs():
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"


class NotificationSubscriptionFollowSyntheses(NotificationSubscriptionGlobal):
    priority = 1
    unsubscribe_allowed = True

    def get_human_readable_description(self):
        return _("A synthesis is posted")

    def wouldCreateNotification(self, discussion_id, verb, object):
        parentWouldCreate = super(NotificationSubscriptionFollowSyntheses, self).wouldCreateNotification(discussion_id, verb, object)
        return parentWouldCreate and (verb == CrudVerbs.CREATE) and isinstance(object, SynthesisPost) and discussion_id == object.get_discussion_id()

    def process(self, discussion_id, verb, objectInstance, otherApplicableSubscriptions):
        from ..tasks.notify import notify
        assert self.wouldCreateNotification(discussion_id, verb, objectInstance)
        notification = NotificationOnPostCreated(
            post=objectInstance,
            first_matching_subscription=self,
            push_method=NotificationPushMethodType.EMAIL,
            # push_address = TODO
            )
        self.db.add(notification)
        self.db.flush()
        notify.delay(notification.id)

    __mapper_args__ = {
        'polymorphic_identity': NotificationSubscriptionClasses.FOLLOW_SYNTHESES
    }


class NotificationSubscriptionFollowAllMessages(NotificationSubscriptionGlobal):
    priority = 1
    unsubscribe_allowed = True

    def get_human_readable_description(self):
        return _("Any message is posted to the discussion")

    def wouldCreateNotification(self, discussion_id, verb, object):
        parentWouldCreate = super(NotificationSubscriptionFollowAllMessages, self).wouldCreateNotification(discussion_id, verb, object)
        return parentWouldCreate and (verb == CrudVerbs.CREATE) and isinstance(object, Post) and discussion_id == object.get_discussion_id()

    def process(self, discussion_id, verb, objectInstance, otherApplicableSubscriptions):
        assert self.wouldCreateNotification(discussion_id, verb, objectInstance)
        from ..tasks.notify import notify
        notification = NotificationOnPostCreated(
            post_id=objectInstance.id,
            first_matching_subscription=self,
            push_method=NotificationPushMethodType.EMAIL,
            # push_address = TODO
            )
        self.db.add(notification)
        self.db.flush()
        notify.delay(notification.id)

    __mapper_args__ = {
        'polymorphic_identity': NotificationSubscriptionClasses.FOLLOW_ALL_MESSAGES
    }


class NotificationSubscriptionFollowOwnMessageDirectReplies(NotificationSubscriptionGlobal):
    priority = 1
    unsubscribe_allowed = True

    def get_human_readable_description(self):
        return _("Someone directly responds to one of your messages")

    def wouldCreateNotification(self, discussion_id, verb, object):
        parentWouldCreate = super(NotificationSubscriptionFollowOwnMessageDirectReplies, self).wouldCreateNotification(discussion_id, verb, object)
        return (
            parentWouldCreate and
            (verb == CrudVerbs.CREATE) and
            isinstance(object, Post) and
            discussion_id == object.get_discussion_id() and
            object.parent is not None and
            object.parent.creator == self.user
        )

    def process(self, discussion_id, verb, objectInstance, otherApplicableSubscriptions):
        assert self.wouldCreateNotification(discussion_id, verb, objectInstance)
        from ..tasks.notify import notify
        notification = NotificationOnPostCreated(
            post=objectInstance,
            first_matching_subscription=self,
            push_method=NotificationPushMethodType.EMAIL,
            # push_address = TODO
            )
        self.db.add(notification)
        self.db.flush()
        notify.delay(notification.id)

    __mapper_args__ = {
        'polymorphic_identity': NotificationSubscriptionClasses.FOLLOW_OWN_MESSAGES_DIRECT_REPLIES
    }


class ModelEventWatcherNotificationSubscriptionDispatcher(BaseModelEventWatcher):
    """Calls :py:meth:`NotificationSubscription.process` on the appropriate
    :py:class:`NotificationSubscription` subclass when a certain CRUD event
    is detected through the :py:class:`assembl.lib.model_watcher.IModelEventWatcher`
    protocol"""

    def processPostCreated(self, objectId):
        self.createNotifications(objectId)

    @classmethod
    def createNotifications(cls, objectId):
        from ..lib.utils import get_concrete_subclasses_recursive
        verb = CrudVerbs.CREATE
        objectClass = Content
        assert objectId
        objectInstance = waiting_get(objectClass, objectId)
        assert objectInstance
        assert objectInstance.id
        # We need the discussion id
        assert isinstance(objectInstance, DiscussionBoundBase)
        applicableInstancesByUser = defaultdict(list)
        subscriptionClasses = get_concrete_subclasses_recursive(NotificationSubscription)
        for subscriptionClass in subscriptionClasses:
            applicableInstances = subscriptionClass.findApplicableInstances(objectInstance.get_discussion_id(), CrudVerbs.CREATE, objectInstance)
            for subscription in applicableInstances:
                applicableInstancesByUser[subscription.user_id].append(subscription)
        num_instances = len([v for v in applicableInstancesByUser.itervalues() if v])
        print "processEvent: %d notifications created for %s %s %d" % (
            num_instances, verb, objectClass.__name__, objectId)
        with transaction.manager:
            for userId, applicableInstances in applicableInstancesByUser.iteritems():
                if(len(applicableInstances) > 0):
                    applicableInstances.sort(cmp=lambda x, y: cmp(x.priority, y.priority))
                    applicableInstances[0].process(objectInstance.get_discussion_id(), verb, objectInstance, applicableInstances[1:])


class NotificationPushMethodType(DeclEnum):
    """
    The type of event that caused the notification to be created
    """
    EMAIL = "EMAIL", "Email notification"
    LOGIN_NOTIFICATION = "LOGIN_NOTIFICATION", "A notification upon next login to Assembl"


class NotificationDeliveryStateType(DeclEnum):
    """
    The delivery state of the notification.  Essentially it's licefycle
    """
    QUEUED = "QUEUED", "Active notification ready to be sent over some transport"
    DELIVERY_IN_PROGRESS = "DELIVERY_IN_PROGRESS", "Active notification that has successfully been handed over some transport, but whose reception hasn't been confirmed"
    DELIVERY_CONFIRMED = "DELIVERY_CONFIRMED", "Active notification whose delivery has been confirmed by the transport"
    READ_CONFIRMED = "READ_CONFIRMED", "Active notification that the user has unambiguously received (ex:  clicked on a link in the notification)"
    DELIVERY_FAILURE = "DELIVERY_FAILURE", "Inactive notification whose failure has been confirmed by the transport.  If possible should be retried on another channel"
    DELIVERY_TEMPORARY_FAILURE = "DELIVERY_TEMPORARY_FAILURE", "Active notification whose delivery is delayed.  Ex:  email soft-bounce, smtp server is down, etc."
    OBSOLETED = "OBSOLETED", "Inactive notification that has been rendered useless by some event.  For example, the user has read the message the notification was about from the web interface before the notification was delivered"
    EXPIRED = "EXPIRED", "Similar to OBSOLETED:  Inactive notification that has been rendered obsolete by the mere passage of time since the first delivery attempt."

    @classmethod
    def getNonRetryableDeliveryStates(cls):
        # TODO benoitg: Validate that QUEUED is non-retryable
        return [cls.DELIVERY_IN_PROGRESS,
                cls.DELIVERY_CONFIRMED,
                cls.READ_CONFIRMED,
                cls.DELIVERY_FAILURE,
                cls.OBSOLETED,
                cls.EXPIRED]

    @classmethod
    def getRetryableDeliveryStates(cls):
        return [cls.QUEUED, cls.DELIVERY_TEMPORARY_FAILURE]


class NotificationDeliveryConfirmationType(DeclEnum):
    """
    The type of event that caused the notification to be created
    """
    NONE = "NONE", "TNo confirmation was recieved"
    LINK_FOLLOWED = "LINK_FOLLOWED", "The user followed a link in the notification"
    NOTIFICATION_DISMISSED = "NOTIFICATION_DISMISSED", "The user dismissed the notification"


class NotificationClasses():

    ABSTRACT_NOTIFICATION = "ABSTRACT_NOTIFICATION"
    ABSTRACT_NOTIFICATION_ON_POST = "ABSTRACT_NOTIFICATION_ON_POST"
    NOTIFICATION_ON_POST_CREATED = "NOTIFICATION_ON_POST_CREATED"
    ABSTRACT_NOTIFICATION_SUBSCRIPTION_ON_POST = "ABSTRACT_NOTIFICATION_SUBSCRIPTION_ON_POST"
    ABSTRACT_NOTIFICATION_SUBSCRIPTION_ON_IDEA = "ABSTRACT_NOTIFICATION_SUBSCRIPTION_ON_IDEA"
    ABSTRACT_NOTIFICATION_SUBSCRIPTION_ON_EXTRACT = "ABSTRACT_NOTIFICATION_SUBSCRIPTION_ON_EXTRACT"
    ABSTRACT_NOTIFICATION_SUBSCRIPTION_ON_USERACCOUNT = "ABSTRACT_NOTIFICATION_SUBSCRIPTION_ON_USERACCOUNT"


class UnverifiedEmailException(Exception):
    pass


class MissingEmailException(Exception):
    pass


class Notification(Base):
    """
    A notification to a user about some situation.
    """
    __tablename__ = "notification"
    __mapper_args__ = {
        'polymorphic_identity': NotificationClasses.ABSTRACT_NOTIFICATION,
        'polymorphic_on': 'sqla_type',
        'with_polymorphic': '*'
    }
    id = Column(
        Integer,
        primary_key=True)

    sqla_type = Column(
        String,
        nullable=False,
        index=True)

    first_matching_subscription_id = Column(
        Integer,
        ForeignKey(
            'notification_subscription.id',
            ondelete='CASCADE',  # Apparently, virtuoso doesn't suport ondelete RESTRICT
            onupdate='CASCADE'
            ),
        nullable=False,  # Maybe should be true, not sure-benoitg
        doc="An annonymous pointer to the database object that originated the event")

    first_matching_subscription = relationship(
        NotificationSubscription,
        backref=backref('notifications', cascade="all, delete-orphan")
    )
    creation_date = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow)
    # user_id we can get it from the notification for "free"
    # Note:  The may be more than one interface to view notification, but we assume there is only one push method àt a time
    push_method = Column(
        NotificationPushMethodType.db_type(),
        nullable=False,
        default=NotificationPushMethodType.EMAIL)
    push_address = Column(
        UnicodeText,
        nullable=True)
    push_date = Column(
        DateTime,
        nullable=True,
        default=None)
    delivery_state = Column(
        NotificationDeliveryStateType.db_type(),
        nullable=False,
        default=NotificationDeliveryStateType.QUEUED)
    delivery_confirmation = Column(
        NotificationDeliveryConfirmationType.db_type(),
        nullable=False,
        default=NotificationDeliveryConfirmationType.NONE)
    delivery_confirmation_date = Column(
        DateTime,
        nullable=True)

    threadlocals = threading.local()

    @abstractmethod
    def event_source_object(self):
        pass

    def event_source_type(self):
        return self.event_source_object().external_typename()

    def get_applicable_subscriptions(self):
        """ Fist matching_subscription is guaranteed to always be on top """
        # TODO: Store CRUDVERB
        applicableInstances = NotificationSubscription.findApplicableInstances(
            self.event_source_object().get_discussion_id(),
            CrudVerbs.CREATE,
            self.event_source_object(),
            self.first_matching_subscription.user)

        def sortSubscriptions(x, y):
            if x.id == self.first_matching_subscription_id:
                return -1
            elif y.id == self.first_matching_subscription_id:
                return 1
            else:
                return cmp(x.priority, y.priority)
        applicableInstances.sort(cmp=sortSubscriptions)
        return applicableInstances

    def render_to_email_html_part(self):
        """Override in child classes if your notification can be represented as
         email HTML part.  Otherwise return a falsy string (len must be defined)"""
        return False

    def render_to_email_text_part(self):
        """Override in child classes if your notification can be represented as
         email HTML part.  Otherwise return a falsy string (len must be defined)"""
        return ''

    @abstractmethod
    def get_notification_subject(self):
        """Typically for email"""

    @classmethod
    def make_unlocalized_jinja_env(cls):
        return Environment(
            loader=PackageLoader('assembl', 'templates'),
            extensions=['jinja2.ext.i18n'])

    @classmethod
    def make_jinja_env(cls, user=None):
        jinja_env = cls.make_unlocalized_jinja_env()
        cls.setup_localizer(jinja_env, user)
        return jinja_env

    def get_jinja_env(self):
        threadlocals = self.threadlocals
        if getattr(threadlocals, 'jinja_env', None) is None:
            threadlocals.jinja_env = self.make_unlocalized_jinja_env()
        self.setup_localizer(
            threadlocals.jinja_env, self.first_matching_subscription.user)
        return threadlocals.jinja_env

    @classmethod
    def get_localizer(cls, user=None):
        if user:
            locale = user.get_preferred_locale()
        else:
            locale = config.get(
                'available_languages', 'fr_CA en_CA').split()[0]
        # TODO: if locale has country code, make sure we fallback properly.
        path = os.path.abspath(join(dirname(__file__), os.path.pardir, 'locale'))
        return make_localizer(locale, [path])

    @classmethod
    def setup_localizer(cls, jinja_env=None, user=None):
        localizer = cls.get_localizer(user)
        jinja_env = jinja_env or cls.make_unlocalized_jinja_env()
        jinja_env.install_gettext_callables(
            partial(localizer.translate, domain='assembl'),
            partial(localizer.pluralize, domain='assembl'),
            newstyle=True)

    @classmethod
    def get_css_paths(cls, discussion):
        from ..views import get_theme_info, get_theme_base_path
        (theme_name, theme_relative_path) = get_theme_info(discussion)
        assembl_css_path = os.path.normpath(os.path.join(get_theme_base_path(), theme_relative_path, 'assembl_notifications.css'))
        assembl_css = open(assembl_css_path)
        assert assembl_css
        ink_css_path = os.path.normpath(os.path.join(os.path.abspath(__file__), '..', '..', 'static', 'js', 'bower', 'ink', 'css', 'ink.css'))
        ink_css = open(ink_css_path)
        assert ink_css
        return (assembl_css, ink_css)

    def get_from_email_address(self):
        from_email = self.first_matching_subscription.discussion.admin_source.admin_sender
        assert from_email
        return from_email

    def get_to_email_address(self):
        """
        :raises: UnverifiedEmailException: If the prefered email isn't validated
        """
        prefered_email_account = self.first_matching_subscription.user.get_preferred_email_account()
        if not prefered_email_account:
            raise MissingEmailException("Missing email account for account " + str(self.first_matching_subscription.user.id))
        if not prefered_email_account.verified:
            raise UnverifiedEmailException("Email account for email " + prefered_email_account.email + "is not verified")
        to_email = prefered_email_account.email
        assert to_email
        return to_email

    def render_to_message(self):
        from ..lib.frontend_urls import FrontendUrls
        email_text_part = self.render_to_email_text_part() or None
        email_html_part = self.render_to_email_html_part()
        if not email_text_part and not email_html_part:
            return ''
        frontendUrls = FrontendUrls(self.first_matching_subscription.discussion)
        headers = {}
        headers['Precedence'] = 'list'

        headers['List-ID'] = self.first_matching_subscription.discussion.uri()
        headers['Date'] = email.Utils.formatdate()

        headers['Message-ID'] = "<" + self.event_source_object().message_id + ">"
        if self.event_source_object().parent:
            headers['In-Reply-To'] = "<" + self.event_source_object().parent.message_id + ">"

        # Archived-At: A direct link to the archived form of an individual email message.
        headers['List-Subscribe'] = frontendUrls.getUserNotificationSubscriptionsConfigurationUrl()
        headers['List-Unsubscribe'] = frontendUrls.getUserNotificationSubscriptionsConfigurationUrl()

        sender = u"%s <%s>" % (
            self.event_source_object().creator.name,
            self.get_from_email_address())
        recipient = self.get_to_email_address()
        message = Message(
            subject=self.get_notification_subject(),
            sender=sender,
            recipients=[recipient],
            extra_headers=headers,
            body=email_text_part, html=email_html_part)

        return message


User.notifications = relationship(
    Notification, viewonly=True,
    secondary=NotificationSubscription.__mapper__.mapped_table,
    backref="owner")


class NotificationOnPost(Notification):

    __tablename__ = "notification_on_post"
    __mapper_args__ = {
        'polymorphic_identity': NotificationClasses.ABSTRACT_NOTIFICATION_ON_POST,
        'polymorphic_on': 'sqla_type',
        'with_polymorphic': '*'
    }

    id = Column(Integer, ForeignKey(
        Notification.id,
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    post_id = Column(
        Integer,
        ForeignKey(
            Post.id,
            ondelete='CASCADE',
            onupdate='CASCADE'),
        nullable=False, index=True)

    post = relationship(Post, backref=backref(
        "notifications_on_post", cascade="all, delete-orphan"))

    @abstractmethod
    def event_source_object(self):
        return self.post


class NotificationOnPostCreated(NotificationOnPost):
    __mapper_args__ = {
        'polymorphic_identity': NotificationClasses.NOTIFICATION_ON_POST_CREATED,
        'with_polymorphic': '*'
    }

    def event_source_object(self):
        return NotificationOnPost.event_source_object(self)

    def get_notification_subject(self):
        loc = self.get_localizer()
        subject = "[" + self.first_matching_subscription.discussion.topic + "] "
        langPrefs = self.first_matching_subscription.get_language_preferences()
        if isinstance(self.post, SynthesisPost):
            subject += loc.translate(_("SYNTHESIS: ")) \
                + (self.post.publishes_synthesis.subject.best_lang(langPrefs).value or "")
        else:
            subject += (self.post.subject.best_lang(langPrefs).value or "")
        return subject

    def render_to_email_html_part(self):
        from ..lib.frontend_urls import FrontendUrls, URL_DISCRIMINANTS, SOURCE_DISCRIMINANTS
        from premailer import Premailer
        discussion = self.first_matching_subscription.discussion
        langPrefs = self.first_matching_subscription.get_language_preferences()
        (assembl_css, ink_css) = self.get_css_paths(discussion)
        jinja_env = self.get_jinja_env()
        template_data = {'subscription': self.first_matching_subscription,
                         'discussion': discussion,
                         'notification': self,
                         'frontendUrls': FrontendUrls(discussion),
                         'ink_css': ink_css.read(),
                         'assembl_notification_css': assembl_css.read().decode('utf_8'),
                         'discriminants': {
                             'url': URL_DISCRIMINANTS,
                             'source': SOURCE_DISCRIMINANTS
                             },
                         'jinja_env': jinja_env,
                         'lang_prefs': langPrefs
                       }
        if isinstance(self.post, SynthesisPost):
            template = jinja_env.get_template('notifications/html_mail_post_synthesis.jinja2')
            template_data['synthesis'] = self.post.publishes_synthesis
        else:
            template = jinja_env.get_template('notifications/html_mail_post.jinja2')
        html = template.render(**template_data)
        return Premailer(html, disable_leftover_css=True).transform()
