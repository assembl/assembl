# -*- coding: utf-8 -*-

#py.test assembl/models/test_notifications.py -s
import pytest
from sqlalchemy import func
from assembl.models import (
    Idea,
    Post,
    SynthesisPost,
    Email,
    User,
    Notification,
    NotificationSubscriptionFollowSyntheses,
    NotificationSubscriptionFollowAllMessages,
    NotificationSubscriptionFollowOwnMessageDirectReplies,
    NotificationCreationOrigin,
    NotificationSubscriptionStatus
)

from assembl.models.notification import (
    ModelEventWatcherNotificationSubscriptionDispatcher)


def test_subscribe_notification(test_session, discussion, participant1_user,
                                reply_post_2, test_app, root_post_1):

    test_session.flush()
    subscription = NotificationSubscriptionFollowSyntheses(
        discussion=discussion,
        user=participant1_user,
        creation_origin=NotificationCreationOrigin.USER_REQUESTED
    )
    test_session.add(subscription)
    test_session.flush()


def test_subscribe_notification_unique_checks(
        test_session, discussion, participant1_user, participant2_user,
        reply_post_2, test_app, root_post_1, test_webrequest):
    test_session.commit()  # this is voodoo so finalizers do not crash
    test_session.flush()
    subscription = NotificationSubscriptionFollowSyntheses(
        discussion=discussion,
        user=participant1_user,
        creation_origin=NotificationCreationOrigin.USER_REQUESTED
    )
    test_session.add(subscription)

    # On insert
    from assembl.lib.sqla import ObjectNotUniqueError
    with pytest.raises(ValueError):
        try:
            subscription = NotificationSubscriptionFollowSyntheses(
                discussion=discussion,
                user=participant1_user,
                creation_origin=NotificationCreationOrigin.USER_REQUESTED
            )
            test_session.add(subscription)
            test_session.flush()

        except ObjectNotUniqueError as e:
            # this is voodoo so finalizers do not crash
            test_session.rollback()
            raise e

    # WRITEME:  update check


# def test_subscribe_notification_access_control


def test_notification_follow_synthesis(test_session, discussion,
                                       participant1_user, reply_post_2,
                                       test_app, root_post_1,
                                       synthesis_post_1):
    test_session.flush()
    subscription = NotificationSubscriptionFollowSyntheses(
        discussion=discussion,
        user=participant1_user,
        creation_origin=NotificationCreationOrigin.USER_REQUESTED
    )
    test_session.add(subscription)

    initial_notification_count = test_session.query(Notification).count()
    dispatcher = ModelEventWatcherNotificationSubscriptionDispatcher()
    dispatcher.processPostCreated(reply_post_2.id)
    notification_count = test_session.query(Notification).count()
    assert notification_count == initial_notification_count, "The post wasn't a synthesis and shouldn't have been caught"
    initial_last_status_change_date = subscription.last_status_change_date
    subscription.status = NotificationSubscriptionStatus.UNSUBSCRIBED
    assert subscription.last_status_change_date > initial_last_status_change_date, "The last status change date should have auto-updated"
    dispatcher.processPostCreated(synthesis_post_1.id)
    notification_count = test_session.query(Notification).count()
    assert notification_count == initial_notification_count, "The synthesis shouldn't have created a notification, because the subscription is unsubscribed"
    subscription.status = NotificationSubscriptionStatus.ACTIVE
    dispatcher.processPostCreated(synthesis_post_1.id)
    notification_count = test_session.query(Notification).count()
    assert notification_count == initial_notification_count + 1, "The synthesis post should have matched and created a notification"


def test_synthesis_notification_in_user_preferred_language_fr(test_session, discussion,
                                                           participant1_user, participant1_user_language_preference_fr_cookie,
                                                           test_app, root_post_1,
                                                           synthesis_post_1):
    test_session.flush()
    subscription = NotificationSubscriptionFollowSyntheses(
        discussion=discussion,
        user=participant1_user,
        creation_origin=NotificationCreationOrigin.USER_REQUESTED
    )
    test_session.add(subscription)

    initial_notification_count = test_session.query(Notification).count()
    dispatcher = ModelEventWatcherNotificationSubscriptionDispatcher()

    notification_count = test_session.query(Notification).count()
    
    dispatcher.processPostCreated(synthesis_post_1.id)

    last_notification = participant1_user.notifications[-1]

    html_content = last_notification.render_to_email_html_part()

    assert "subject FR" in html_content
    assert "introduction FR" in html_content
    assert "conclusion FR" in html_content
    # TODO: also check that syntheses of several ideas do also show in the user's preferred language, and other gettext strings if available


def test_synthesis_notification_in_user_preferred_language_en(test_session, discussion,
                                                           participant1_user, participant1_user_language_preference_en_cookie,
                                                           test_app, root_post_1,
                                                           synthesis_post_1):
    test_session.flush()
    subscription = NotificationSubscriptionFollowSyntheses(
        discussion=discussion,
        user=participant1_user,
        creation_origin=NotificationCreationOrigin.USER_REQUESTED
    )
    test_session.add(subscription)

    initial_notification_count = test_session.query(Notification).count()
    dispatcher = ModelEventWatcherNotificationSubscriptionDispatcher()

    notification_count = test_session.query(Notification).count()
    
    dispatcher.processPostCreated(synthesis_post_1.id)

    last_notification = participant1_user.notifications[-1]

    html_content = last_notification.render_to_email_html_part()

    assert "subject EN" in html_content
    assert "introduction EN" in html_content
    assert "conclusion EN" in html_content
    # TODO: also check that syntheses of several ideas do also show in the user's preferred language, and other gettext strings if available


def test_notification_follow_all_messages(test_session, discussion,
                                          participant1_user, reply_post_2,
                                          test_app, root_post_1,
                                          synthesis_post_1,
                                          discussion2_root_post_1):
    test_session.flush()
    subscription = NotificationSubscriptionFollowAllMessages(
        discussion=discussion,
        user=participant1_user,
        creation_origin=NotificationCreationOrigin.USER_REQUESTED,
    )
    test_session.add(subscription)

    initial_notification_count = test_session.query(Notification).count()
    dispatcher = ModelEventWatcherNotificationSubscriptionDispatcher()
    dispatcher.processPostCreated(reply_post_2.id)
    notification_count = test_session.query(Notification).count()
    assert notification_count == initial_notification_count + 1, "A new post should have been caught"

    # Check that subclasses are still caught
    dispatcher.processPostCreated(synthesis_post_1.id)
    notification_count = test_session.query(Notification).count()
    assert notification_count == initial_notification_count + 2, "A post with a subclass should have been caught"

    # Smoke test that other discussion's post do not leak
    dispatcher.processPostCreated(discussion2_root_post_1.id)
    notification_count = test_session.query(Notification).count()
    assert notification_count == initial_notification_count + 2, "A post from another discussion should NOT have been caught"


def test_users_not_subscribed_to_discussion(test_session, discussion,
                                            participant1_user, reply_post_2,
                                            test_app, root_post_1,
                                            synthesis_post_1,
                                            discussion2_root_post_1,
                                            test_webrequest):
    test_session.flush()
    subscription = NotificationSubscriptionFollowAllMessages(
        discussion=discussion,
        user=participant1_user,
        creation_origin=NotificationCreationOrigin.USER_REQUESTED,
    )
    test_session.add(subscription)

    initial_notification_count = test_session.query(Notification).count()
    dispatcher = ModelEventWatcherNotificationSubscriptionDispatcher()
    dispatcher.processPostCreated(reply_post_2.id)
    notification_count = test_session.query(Notification).count()
    assert notification_count == initial_notification_count + 1, "A new post should have been caught"

    # Smoke test that unsubscribing from a discussion
    # does inhibit notifications
    participant1_user.unsubscribe(discussion)
    test_session.commit()
    dispatcher.processPostCreated(reply_post_2.id)
    notification_count = test_session.query(Notification).count()
    assert notification_count == initial_notification_count + 1, "The user should NOT receive notification if not subscribed to the discussion"
    participant1_user.subscribe(discussion)


def test_notification_follow_direct_replies(test_session, discussion,
                                            participant1_user,
                                            participant2_user, root_post_1,
                                            reply_post_1, reply_post_2,
                                            test_app):
    # Note:
    # the author of root_post_1 is participant1_user
    # the author of reply_post_1 is participant2_user
    # the author of reply_post_2 is participant1_user
    # the author of reply_post_3 is participant2_user
    test_session.flush()
    subscription = NotificationSubscriptionFollowOwnMessageDirectReplies(
        discussion=discussion,
        user=participant1_user,
        creation_origin=NotificationCreationOrigin.USER_REQUESTED,
    )
    test_session.add(subscription)

    initial_notification_count = test_session.query(Notification).count()
    dispatcher = ModelEventWatcherNotificationSubscriptionDispatcher()

    dispatcher.processPostCreated(reply_post_1.id)
    notification_count = test_session.query(Notification).count()
    assert notification_count == initial_notification_count + 1, "Direct reply should have created a notification"

    dispatcher.processPostCreated(reply_post_2.id)
    notification_count = test_session.query(Notification).count()
    assert notification_count == initial_notification_count + 1, "Indirect reply should not have created a new notification"


def test_notification_multiple_subscriptions_create_single_notification(
    test_session, discussion, participant1_user, reply_post_2, test_app,
        root_post_1, synthesis_post_1):
    test_session.flush()
    subscription = NotificationSubscriptionFollowAllMessages(
        discussion=discussion,
        user=participant1_user,
        creation_origin=NotificationCreationOrigin.USER_REQUESTED,
    )
    test_session.add(subscription)
    subscription2 = NotificationSubscriptionFollowSyntheses(
        discussion=discussion,
        user=participant1_user,
        creation_origin=NotificationCreationOrigin.USER_REQUESTED,
    )
    test_session.add(subscription2)

    initial_notification_count = test_session.query(Notification).count()
    dispatcher = ModelEventWatcherNotificationSubscriptionDispatcher()
    dispatcher.processPostCreated(synthesis_post_1.id)
    notification_count = test_session.query(Notification).count()
    assert notification_count == initial_notification_count + 1

# def test_subscribe_notification_access_control
# TODO: Check that other subscriptions are passed to process method
