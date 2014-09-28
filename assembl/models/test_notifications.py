# -*- coding: utf-8 -*-

#py.test assembl/models/test_notifications.py 
import pytest
from assembl.models import (
    Idea,
    Post,
    SynthesisPost,
    Email,
    User,
    Notification,
    NotificationSubscriptionFollowSyntheses,
    NotificationSubscriptionFollowAllMessages
)
from sqlalchemy import func
from .notification import ModelEventWatcherNotificationSubscriptionDispatcher

def test_subscribe_notification(test_session, 
        discussion, participant1_user, reply_post_2, test_app, root_post_1):
    
    test_session.flush()
    subscription = NotificationSubscriptionFollowSyntheses(
        discussion=discussion, user=participant1_user,
       )
    test_session.add(subscription)
    test_session.flush()

#def test_subscribe_notification_access_control

def test_notification_follow_synthesis(test_session, 
        discussion, participant1_user, reply_post_2, test_app, root_post_1, synthesis_post_1):
    
    test_session.flush()
    subscription = NotificationSubscriptionFollowSyntheses(
        discussion=discussion, user=participant1_user,
       )
    test_session.add(subscription)
    
    initial_notification_count = test_session.query(Notification).count() 
    dispatcher = ModelEventWatcherNotificationSubscriptionDispatcher()
    dispatcher.processPostCreated(reply_post_2.id)
    notification_count = test_session.query(Notification).count() 
    assert notification_count == initial_notification_count
    dispatcher.processPostCreated(synthesis_post_1.id)
    notification_count = test_session.query(Notification).count() 
    assert notification_count == initial_notification_count + 1

#def test_subscribe_notification_access_control

def test_notification_follow_all_messages(test_session, 
        discussion, participant1_user, reply_post_2, test_app, root_post_1, synthesis_post_1):
    
    test_session.flush()
    subscription = NotificationSubscriptionFollowAllMessages(
        discussion=discussion, user=participant1_user,
       )
    test_session.add(subscription)
    
    initial_notification_count = test_session.query(Notification).count() 
    dispatcher = ModelEventWatcherNotificationSubscriptionDispatcher()
    dispatcher.processPostCreated(reply_post_2.id)
    notification_count = test_session.query(Notification).count() 
    assert notification_count == initial_notification_count + 1
    #Chexk thas subclasses are still caught
    dispatcher.processPostCreated(synthesis_post_1.id)
    notification_count = test_session.query(Notification).count() 
    assert notification_count == initial_notification_count + 2

def test_notification_multiple_subscriptions_create_single_notification(test_session, 
        discussion, participant1_user, reply_post_2, test_app, root_post_1, synthesis_post_1):
    
    test_session.flush()
    subscription = NotificationSubscriptionFollowAllMessages(
        discussion=discussion, user=participant1_user,
       )
    test_session.add(subscription)
    subscription2 = NotificationSubscriptionFollowSyntheses(
        discussion=discussion, user=participant1_user,
       )
    test_session.add(subscription2)
    
    initial_notification_count = test_session.query(Notification).count() 
    dispatcher = ModelEventWatcherNotificationSubscriptionDispatcher()
    dispatcher.processPostCreated(synthesis_post_1.id)
    notification_count = test_session.query(Notification).count()
    assert notification_count == initial_notification_count + 1
