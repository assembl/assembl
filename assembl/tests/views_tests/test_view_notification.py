# -*- coding: utf-8 -*-
import pytest
from datetime import datetime

import simplejson as json

from assembl.models import (
    NotificationSubscription,
    UserTemplate,
    Role,
    Notification
)
from assembl.models.notification import (
    NotificationSubscriptionClasses,
    NotificationSubscriptionStatus,
    NotificationCreationOrigin,
)
from assembl.auth import R_PARTICIPANT
from assembl.models.notification import (
    ModelEventWatcherNotificationSubscriptionDispatcher)


def local_to_absolute(uri):
    if uri.startswith('local:'):
        return '/data/' + uri[6:]
    return uri


def test_default_notifications(test_app, test_session, discussion, participant1_user):
    from assembl.auth import R_PARTICIPANT
    from assembl.models.auth import Role, LocalUserRole
    # Set conditions for user to be subscribable
    participant1_user.update_agent_status_last_visit(discussion)
    test_session.flush()
    # Template created
    assert len(discussion.user_templates) == 1
    template = discussion.user_templates[0]
    # Template has base subscriptions to start with
    assert len(template.notification_subscriptions) == 3
    # Get the user's notification subscriptions (accessing this route makes the backend materialize user's missing notification subscriptions, based on discussion notification settings, which are set through discussion's user_template notification subscriptions). Should not be empty.
    response = test_app.get(
        '/data/Discussion/%d/all_users/%d/notification_subscriptions' % (
            discussion.id, participant1_user.id))
    assert response.status_code == 200
    user_notif_subsc = response.json
    assert len(user_notif_subsc)
    # Template now have subscriptions
    discussion.db.expire(template, ['notification_subscriptions'])
    assert len(template.notification_subscriptions) >= 3
    # Get the template's subscriptions.
    response = test_app.get(
        '/data/Discussion/%d/user_templates/-/notification_subscriptions' % (
            discussion.id,))
    assert response.status_code == 200
    template_notif_subsc = response.json
    assert len(template_notif_subsc) >= 3
    # Get an unsubscribed default
    t_unsubs = [s for s in template_notif_subsc if s['status'] != "ACTIVE"]
    assert t_unsubs
    t_unsub = t_unsubs[0]
    # It should not be in the user's defaults
    corresponding = [s for s in user_notif_subsc if s['@type'] == t_unsub['@type']]
    assert not len(corresponding)
    # Make it active
    t_unsub['status'] = "ACTIVE"
    t_unsub_id = NotificationSubscription.get_database_id(t_unsub['@id'])
    response = test_app.put_json(
        '/data/Discussion/%d/user_templates/-/notification_subscriptions/%d' % (
        discussion.id, t_unsub_id),
        t_unsub)
    assert response.status_code == 200  # or 204?
    # Check if the user's subscriptions were affected
    response = test_app.get(
        '/data/Discussion/%d/all_users/%d/notification_subscriptions' % (
            discussion.id, participant1_user.id))
    assert response.status_code == 200
    user_notif_subsc_new = response.json
    assert len(user_notif_subsc_new) > len(user_notif_subsc)
    corresponding = [s for s in user_notif_subsc_new if s['@type'] == t_unsub['@type']]
    assert len(corresponding) == 1
    assert corresponding[0]['status'] == "ACTIVE"
    assert corresponding[0]['creation_origin'] == "DISCUSSION_DEFAULT"
    # Revert.
    t_unsub['status'] = "INACTIVE_DFT"
    response = test_app.put_json(
        '/data/Discussion/%d/user_templates/-/notification_subscriptions/%d' % (
        discussion.id, t_unsub_id),
        t_unsub)
    assert response.status_code == 200  # or 204?
    # Check if the user's subscriptions were affected again
    response = test_app.get(
        '/data/Discussion/%d/all_users/%d/notification_subscriptions' % (
            discussion.id, participant1_user.id))
    assert response.status_code == 200
    user_notif_subsc_3 = response.json
    print user_notif_subsc_3
    corresponding = [s for s in user_notif_subsc_3 if s['@type'] == t_unsub['@type']]
    assert len(corresponding) == 1
    assert corresponding[0]['status'] != "ACTIVE"
    assert corresponding[0]['creation_origin'] == "DISCUSSION_DEFAULT"


def test_user_unsubscribed_stable(test_app, discussion, admin_user, participant1_user):
    # Template created
    assert len(discussion.user_templates) == 1
    template = discussion.user_templates[0]
    # Template has base subscriptions to start with
    assert len(template.notification_subscriptions) == 3
    # Get the user's notifications. Should not be empty.
    response = test_app.get(
        '/data/Discussion/%d/all_users/%d/notification_subscriptions' % (
            discussion.id, participant1_user.id))
    assert response.status_code == 200
    user_notif_subsc = response.json
    assert len(user_notif_subsc)
    default_subscribed = user_notif_subsc[0]
    # Template now have subscriptions
    discussion.db.expire(template, ['notification_subscriptions'])
    assert len(template.notification_subscriptions) >= 3
    # Get the template's subscriptions.
    response = test_app.get(
        '/data/Discussion/%d/user_templates/-/notification_subscriptions' % (
            discussion.id,))
    assert response.status_code == 200
    template_notif_subsc = response.json
    assert len(template_notif_subsc) >= 3
    # Change the user default's subscribed to user-unsubscribed
    default_subscribed['status'] = "UNSUBSCRIBED"
    del default_subscribed['creation_origin']
    default_subscribed_id = NotificationSubscription.get_database_id(default_subscribed['@id'])
    response = test_app.put_json(
        '/data/Discussion/%d/all_users/%d/notification_subscriptions/%d' % (
        discussion.id, participant1_user.id, default_subscribed_id),
        default_subscribed)
    # Change the template default to unsubscribed
    corresponding = [s for s in template_notif_subsc if s['@type'] == default_subscribed['@type']]
    assert len(corresponding) == 1
    corresponding = corresponding[0]
    assert corresponding['status'] == "ACTIVE"
    corresponding['status'] = 'INACTIVE_DFT'
    corresponding_id = NotificationSubscription.get_database_id(corresponding['@id'])
    response = test_app.put_json(
        '/data/Discussion/%d/user_templates/-/notification_subscriptions/%d' % (
        discussion.id, corresponding_id),
        corresponding)
    assert response.status_code == 200  # or 204?
    # Change it back to subscribed
    corresponding['status'] = 'ACTIVE'
    response = test_app.put_json(
        '/data/Discussion/%d/user_templates/-/notification_subscriptions/%d' % (
        discussion.id, corresponding_id),
        corresponding)
    assert response.status_code == 200  # or 204?
    # check that the user's default was not affected
    response = test_app.get(
        '/data/Discussion/%d/all_users/%d/notification_subscriptions/%d' % (
        discussion.id, participant1_user.id, default_subscribed_id),
        default_subscribed)
    assert response.status_code == 200
    default_subscribed_after = response.json
    assert default_subscribed_after['status'] == 'UNSUBSCRIBED'



def test_user_subscribed_stable(test_app, discussion, admin_user, participant1_user):
   # Template created
    assert len(discussion.user_templates) == 1
    template = discussion.user_templates[0]
    # Template has base subscriptions to start with
    assert len(template.notification_subscriptions) == 3
    # Get the user's notifications. Should not be empty.
    response = test_app.get(
        '/data/Discussion/%d/all_users/%d/notification_subscriptions' % (
            discussion.id, participant1_user.id))
    assert response.status_code == 200
    user_notif_subsc = response.json
    assert len(user_notif_subsc)
    default_subscribed = user_notif_subsc[0]
    # Template now have subscriptions
    discussion.db.expire(template, ['notification_subscriptions'])
    assert len(template.notification_subscriptions) >= 3
    # Get the template's subscriptions.
    response = test_app.get(
        '/data/Discussion/%d/user_templates/-/notification_subscriptions' % (
            discussion.id,))
    assert response.status_code == 200
    template_notif_subsc = response.json
    assert len(template_notif_subsc) >= 3
    # Get an unsubscribed default
    t_unsubs = [s for s in template_notif_subsc if s['status'] != "ACTIVE"]
    assert t_unsubs
    t_unsub = t_unsubs[0]
    # It should not be in the user's defaults
    corresponding = [s for s in user_notif_subsc if s['@type'] == t_unsub['@type']]
    assert not len(corresponding)
    # Subscribe the user
    new_subscription = {
        "status": "ACTIVE",
        "@type": t_unsub["@type"]
    }
    response = test_app.post_json(
        '/data/Discussion/%d/all_users/%d/notification_subscriptions' % (
        discussion.id, participant1_user.id),
        new_subscription)
    assert response.status_code == 201
    new_subscription_id = NotificationSubscription.get_database_id(response.location)
    # Make the default active
    t_unsub['status'] = "ACTIVE"
    t_unsub_id = NotificationSubscription.get_database_id(t_unsub['@id'])
    response = test_app.put_json(
        '/data/Discussion/%d/user_templates/-/notification_subscriptions/%d' % (
        discussion.id, t_unsub_id),
        t_unsub)
    assert response.status_code == 200  # or 204?
    # Make the default inactive again
    t_unsub['status'] = "INACTIVE_DFT"
    response = test_app.put_json(
        '/data/Discussion/%d/user_templates/-/notification_subscriptions/%d' % (
        discussion.id, t_unsub_id),
        t_unsub)
    assert response.status_code == 200  # or 204?
    # check that the user's default was not affected
    response = test_app.get(
        '/data/Discussion/%d/all_users/%d/notification_subscriptions/%d' % (
        discussion.id, participant1_user.id, new_subscription_id),
        default_subscribed)
    assert response.status_code == 200
    default_subscribed_after = response.json
    assert default_subscribed_after['status'] == 'ACTIVE'


def test_discussion_has_default_participant_user_template_with_default_notification_subscriptions(test_app, test_session, discussion):
    # See also `test_adding_a_discussion_automatically_adds_participant_user_template_for_notifications` in `model_test/test_discussion.py` which just checks that discussion has a participant user template

    # Check that discussion's user template for role participant has correct default notification subscriptions
    participant_role = test_session.query(Role).filter_by(name=R_PARTICIPANT).one()
    user_templates_for_role_participant = test_session.query(UserTemplate).filter_by(discussion=discussion, for_role=participant_role).all()
    assert len(user_templates_for_role_participant) > 0
    template_user = user_templates_for_role_participant[0]
    subscriptions = template_user.notification_subscriptions
    # There are currently 3 default notification subscriptions, of `type` "NotificationSubscriptionFollowAllMessages", "NotificationSubscriptionFollowOwnMessageDirectReplies", "NotificationSubscriptionFollowSyntheses". Their `creation_origin` is "DISCUSSION_DEFAULT", and their `status` is either "ACTIVE" or "UNSUBSCRIBED", depending on application config (determined by the value of `subscriptions.participant.default` in ini file).
    assert len(subscriptions) == 3

    subscriptions_expected_status_per_type = {}
    subscriptions_expected_status_per_type[NotificationSubscriptionClasses.FOLLOW_SYNTHESES] = NotificationSubscriptionStatus.ACTIVE # TODO: read from app config which subscriptions should be present

    for k, v in subscriptions_expected_status_per_type.iteritems():
        subscriptions = filter(lambda x: x.type == k, subscriptions)
        assert len(subscriptions) == 1
        subscription = subscriptions[0]
        assert subscription.status == v
        assert subscription.creation_origin == NotificationCreationOrigin.DISCUSSION_DEFAULT

def test_notification_is_created_when_synthesis_is_posted_and_participant_had_proactively_materialized_default_notification_subscriptions(test_app, test_session, discussion, participant1_user, synthesis_post_1):
    # The purpose of this test is to check that a participant who has not changed their notification preferences (from discussion's defaults), but who have proactively asked for materialization of their notification subscriptions (for example by visiting their "Notifications" page, which calls `user.get_notification_subscriptions()` which materializes missing user notification subscriptions from default discussion notification settings) does actually receive a notification.

    # `discussion` fixture has FOLLOW_SYNTHESES enabled in its default notification subscription settings. So a participant who has not changed anything to their notification subscriptions also has this subscription enabled. Participant `participant1_user` is in this case.

    test_session.flush()

    # Thanks to `model_tests/test_notification.py::test_notification_follow_synthesis()`, we already know that a participant will receive a synthesis notification if they have first enabled synthesis notification subscription by themselves, for example with this commented code:
    # subscription2 = NotificationSubscriptionFollowSyntheses(
    #     discussion=discussion,
    #     user=participant1_user,
    #     creation_origin=NotificationCreationOrigin.USER_REQUESTED,
    # )
    # test_session.add(subscription2)


    # Before sending a synthesis, we call on purpose an API route that materializes participant notification subscriptions, from discussion defaults
    response = test_app.get(
        '/data/Discussion/%d/all_users/%d/notification_subscriptions' % (
            discussion.id, participant1_user.id))
    assert response.status_code == 200
    user_notification_subscriptions = response.json
    assert len(user_notification_subscriptions)


    initial_notification_count = test_session.query(Notification).count()
    
    # Simulate publication of a synthesis
    dispatcher = ModelEventWatcherNotificationSubscriptionDispatcher()
    dispatcher.processPostCreated(synthesis_post_1.id)

    notification_count = test_session.query(Notification).count()
    assert notification_count == initial_notification_count + 1, "The synthesis post should have matched and created a notification"


@pytest.mark.xfail
def test_notification_is_created_when_synthesis_is_posted_with_default_notification_subscriptions_without_proactive_materialization(test_app, test_session, discussion, participant1_user, synthesis_post_1):
    # The purpose of this test is to check that a participant who has not changed their notification preferences from discussion's default and who has not accessed the debate since any discussion notification settings changes (which means they have not asked proactively for notification materialization, for example by visiting their "Notifications" page, which calls `user.get_notification_subscriptions()` which materializes missing user notification subscriptions from default discussion notification settings) does actually receive a notification.

    # `discussion` fixture has FOLLOW_SYNTHESES enabled in its default notification subscription settings. So a participant who has not changed anything to their notification subscriptions also has this subscription enabled. Participant `participant1_user` is in this case.

    test_session.flush()

    initial_notification_count = test_session.query(Notification).count()

    # Simulate publication of a synthesis
    dispatcher = ModelEventWatcherNotificationSubscriptionDispatcher()
    dispatcher.processPostCreated(synthesis_post_1.id)

    notification_count = test_session.query(Notification).count()
    assert notification_count == initial_notification_count + 1, "The synthesis post should have matched and created a notification"

    # TODO: Check that selected participant has a notification object corresponding to this sent synthesis and to his synthesis notification subscription object
