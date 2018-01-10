# -*- coding: utf-8 -*-
from datetime import datetime

import simplejson as json

from assembl.models import (
    NotificationSubscription,
)


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
    # Get the user's notifications. Should not be empty.
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
