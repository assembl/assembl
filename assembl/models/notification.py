# coding=UTF-8
from datetime import datetime
from . import  Base, DiscussionBoundBase
from sqlalchemy.orm import (
    relationship, backref, aliased, contains_eager, joinedload)
from sqlalchemy import (
    Column,
    Boolean,
    Integer,
    String,
    Float,
    UnicodeText,
    DateTime,
    ForeignKey,
)
from ..lib.model_watcher import IModelEventWatcher
from ..lib.decl_enums import DeclEnum
from .auth import User
from .discussion import Discussion
from zope import interface
from .post import Post, SynthesisPost
from abc import abstractmethod

class CrudVerbs():
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    
class NotificationSubscriptionType(DiscussionBoundBase):
    """
    Currently this table only exists to enforce referential integrity
    """
    __tablename__ = "notification_subscription_type"
    id = Column(Integer, primary_key=True)

class NotificationSubscriptionClasses(DeclEnum):
    #System notifications (can't unsubscribe)
    #EMAIL_BOUNCED = "EMAIL_BOUNCED", "Mandatory"
    #EMAIL_VALIDATE = "", "Mandatory"
    #RECOVER_ACCOUNT = "", ""
    #RECOVER_PASSWORD = "", ""
    #PARTICIPATED_FOR_FIRST_TIME_WELCOME = "", "Mandatory"
    #SUBSCRIPTION_WELCOME = "", "Mandatory"
    # Core notification (unsubscribe strongly discuraged)
    FOLLOW_SYNTHESES = "FOLLOW_SYNTHESES", ""
    FOLLOW_OWN_MESSAGES_REPLIES = "FOLLOW_OWN_MESSAGES_REPLIES", "Mandatory?"
    # Note:  indirect replies are FOLLOW_THREAD_DISCUSSION
    #SESSIONS_STARTING = "SESSIONS_STARTING", ""
    #Follow phase changes?
    #FOLLOW_IDEA_FAMILY_DISCUSSION = "FOLLOW_IDEA_FAMILY_DISCUSSION", ""
    #FOLLOW_IDEA_FAMILY_MEMBERSHIP_CHANGES = "FOLLOW_IDEA_FAMILY_MEMBERSHIP_CHANGES", ""
    #FOLLOW_IDEA_FAMILY_SUB_IDEA_SUGGESTIONS = "FOLLOW_IDEA_FAMILY_SUB_IDEA_SUGGESTIONS", ""
    #FOLLOW_IDEA_CANNONICAL_EXPRESSIONS_CHANGED = "FOLLOW_IDEA_CANNONICAL_EXPRESSIONS_CHANGED", "Title or description changed"
    #FOLLOW_OWN_MESSAGES_NUGGETS = "FOLLOW_OWN_MESSAGES_NUGGETS", ""
    FOLLOW_ALL_MESSAGES = "FOLLOW_ALL_MESSAGES", "NOT the same as following root idea"
    #FOLLOW_ALL_THREAD_NEWLY_PARTICIPATED_IN = "FOLLOW_ALL_THREAD_NEWLY_PARTICIPATED_IN", "Pseudo-notification, that will create new FOLLOW_THREAD_DISCUSSION notifications (so one can unsubscribe)"
    FOLLOW_THREAD_DISCUSSION = "FOLLOW_THREAD_DISCUSSION", ""
    #FOLLOW_USER_POSTS = "FOLLOW_USER_POSTS", ""
    #System notifications (can't unsubscribe)
    #SYSTEM_ERRORST = "", ""
     
class NotificationSubscription(DiscussionBoundBase):
    """
    a subscription to a specific type of notification. Subclasses will implement the actual code
    """
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
        ForeignKey(
                   'discussion.id',
                   ondelete='CASCADE',
                   onupdate='CASCADE'),
        nullable=False,
        index=True,
    )

    discussion = relationship(
        Discussion,
        backref=backref('notificationSubscriptions')
    )
    creation_date = Column(
        DateTime,
        nullable = False,
        default = datetime.utcnow)
    user_id = Column(
        Integer,
        ForeignKey(
            'user.id',
            ondelete='CASCADE',
            onupdate='CASCADE'),
            nullable = False,
            index = True)
    user = relationship(
        User,
        backref=backref('notification_subscriptions', order_by=creation_date)
    )

    followed_object_id = Column(
        Integer,
        nullable = True,
        doc = "Which object type is followed depends on the subscription class")
    #allowed_transports Ex: email_bounce cannot be bounced by the same email.  For now we'll special case in code
    priority = 1 #An integer, if more than one subsciption match for one event, only the one with the lowest integer can create a notification
    unsubscribe_allowed = False
    
    __mapper_args__ = {
        'polymorphic_identity': 'abstract_notification_subscription',
        'polymorphic_on': 'type',
        'with_polymorphic': '*'
    }
    def get_discussion_id(self):
        return self.discussion_id

    @classmethod
    def get_discussion_condition(cls, discussion_id):
        return cls.discussion_id == discussion_id
    

    def wouldCreateNotification(self, discussion_id, verb, object):
        return False
        
    @classmethod
    def findApplicableInstances(cls, discussion_id, verb, object):
        """
        Returns all subscriptions that would fire on the object, and verb given
        
        This naive implementation instanciates every subscription for every user, 
        and calls "would fire" for each.  It is expected that most subclasses will 
        override this with a more optimal implementation 
        """
        applicable_subscriptions = []
        subscriptions = cls.db.query(cls);
        for subscription in subscriptions:
            if(subscription.wouldCreateNotification(object.get_discussion_id(), verb, object)):
                applicable_subscriptions.append(subscription)
        return applicable_subscriptions

class NotificationSubscriptionFollowSyntheses(NotificationSubscription):
    priority = 1
    unsubscribe_allowed = True
    
    def wouldCreateNotification(self, discussion_id, verb, object):
        return (verb == CrudVerbs.CREATE) & isinstance(object, SynthesisPost)
    
    def process(self, discussion_id, verb, object):
        assert self.wouldCreateNotification(discussion_id, verb, object)
        notification = Notification(
            event_source_type = NotificationEventSourceType.MESSAGE_POSTED,
            event_source_object_id = object.id,
            first_matching_subscription = self,
            push_method = NotificationPushMethodType.EMAIL,
            #push_address = TODO
            )
        self.db.add(notification)
        
    __mapper_args__ = {
        'polymorphic_identity': NotificationSubscriptionClasses.FOLLOW_SYNTHESES,
        'with_polymorphic': '*'
    }
    
class ModelEventWatcherNotificationSubscriptionDispatcher(object):
    interface.implements(IModelEventWatcher)
    @staticmethod
    def get_subclasses(c):
        subclasses = c.__subclasses__()
        for d in list(subclasses):
            subclasses.extend(ModelEventWatcherNotificationSubscriptionDispatcher.get_subclasses(d))
        return subclasses

    def processPostCreated(self, id):
        print "processPostCreated", id
        assert id
        post = Post.get(id=id)
        assert post
        subscriptionClasses = ModelEventWatcherNotificationSubscriptionDispatcher.get_subclasses(NotificationSubscription)
        for subscriptionClass in subscriptionClasses:
            applicableInstances = subscriptionClass.findApplicableInstances(post.get_discussion_id(), CrudVerbs.CREATE, post)
            for subscription in applicableInstances:
                subscription.process(post.get_discussion_id, CrudVerbs.CREATE, post)

    def processIdeaCreated(self, id):
        print "processIdeaCreated", id

    def processIdeaModified(self, id, version):
        print "processIdeaModified", id, version

    def processIdeaDeleted(self, id):
        print "processIdeaDeleted", id

    def processExtractCreated(self, id):
        print "processExtractCreated", id

    def processExtractModified(self, id, version):
        print "processExtractModified", id, version

    def processExtractDeleted(self, id):
        print "processExtractDeleted", id

    def processAccountCreated(self, id):
        print "processAccountCreated", id

    def processAccountModified(self, id):
        print "processAccountModified", id
        
class NotificationEventSourceType(DeclEnum):
    """
    The type of event that caused the notification to be created
    """
    MESSAGE_POSTED = "MESSAGE_POSTED", "A message was posted"
    IDEA_SESSION_STARTING = "IDEA_SESSION_STARTING", "A creativity or other session is starting"

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

class NotificationDeliveryConfirmationType(DeclEnum):
    """
    The type of event that caused the notification to be created
    """
    NONE = "NONE", "TNo confirmation was recieved"
    LINK_FOLLOWED = "LINK_FOLLOWED", "The user followed a link in the notification"
    NOTIFICATION_DISMISSED = "NOTIFICATION_DISMISSED", "The user dismissed the notification"

class Notification(Base):
    """
    A notification
    """
    __tablename__ = "notification"
    id = Column(
        Integer,
        primary_key=True)
    event_source_type = Column(
        NotificationEventSourceType.db_type(),
        nullable = False)
    event_source_object_id = Column(
        Integer,
        nullable = False,
        doc="An annonymous pointer to the database object that originated the event")
    first_matching_subscription_id = Column(
        Integer,
        ForeignKey(
            'notification_subscription.id',
            ondelete = 'CASCADE', #Apparently, virtuoso doesn't suport ondelete RESTRICT
            onupdate = 'CASCADE'
            ),
        nullable=False, #Maybe should be true, not sure-benoitg
        doc="An annonymous pointer to the database object that originated the event")
    
    first_matching_subscription = relationship(
        NotificationSubscription,
        backref=backref('notifications')
    )
    creation_date = Column(
        DateTime,
        nullable = False,
        default = datetime.utcnow)
    #user_id we can get it from the notification for "free"
    #Note:  The may be more than one interface to view notification, but we assume there is only one push method àt a time
    push_method =  Column(
        NotificationPushMethodType.db_type(),
        nullable = False,
        default = NotificationPushMethodType.EMAIL)
    push_address = Column(
        UnicodeText,
        nullable = True)
    push_date = Column(
        DateTime,
        nullable = True,
        default = None)
    delivery_state = Column(
        NotificationDeliveryStateType.db_type(),
        nullable = False,
        default = NotificationDeliveryStateType.QUEUED)
    delivery_confirmation = Column(
        NotificationDeliveryConfirmationType.db_type(),
        nullable = False,
        default = NotificationDeliveryConfirmationType.NONE)
    delivery_confirmation_date = Column(
        DateTime,
        nullable = True,
        default = datetime.utcnow)


