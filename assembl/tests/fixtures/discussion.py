import pytest
from sqlalchemy import inspect


@pytest.fixture(scope="function")
def discussion(request, test_session, default_preferences):
    """An empty Discussion fixture with default preferences"""
    from assembl.models import Discussion
    with test_session.no_autoflush:
        d = Discussion(
            topic=u"Jack Layton", slug="jacklayton2",
            subscribe_to_notifications_on_signup=False,
            creator=None,
            session=test_session)
        test_session.add(d)
    test_session.flush()

    def fin():
        print "finalizer discussion"
        discussion = d
        if inspect(discussion).detached:
            # How did this happen?
            discussion = test_session.query(Discussion).get(d.id)
        test_session.delete(discussion.table_of_contents)
        test_session.delete(discussion.root_idea)
        test_session.delete(discussion.next_synthesis)
        preferences = discussion.preferences
        discussion.preferences = None
        discussion.preferences_id = None
        test_session.delete(preferences)
        test_session.delete(discussion)
        test_session.flush()
    request.addfinalizer(fin)
    return d


@pytest.fixture(scope="function")
def discussion_synth_notification(request, test_session, discussion):
    """Notification Subscription on Synthesis fixture"""
    from assembl.models import (
        NotificationSubscriptionFollowSyntheses, NotificationCreationOrigin)
    u = discussion.user_templates[0]
    sns = NotificationSubscriptionFollowSyntheses(
        user=u, discussion=discussion,
        creation_origin=NotificationCreationOrigin.USER_REQUESTED)
    test_session.expire(u, ['notification_subscriptions'])

    def fin():
        print "finalizer discussion_synth_notification"
        test_session.delete(sns)
        test_session.flush()
    request.addfinalizer(fin)
    return sns


@pytest.fixture(scope="function")
def discussion2(request, test_session):
    """An non-empty Discussion fixture with default preferences"""
    from assembl.models import Discussion
    d = Discussion(
        topic=u"Second discussion", slug="testdiscussion2", creator=None)
    test_session.add(d)
    test_session.add(d.next_synthesis)
    test_session.add(d.root_idea)
    test_session.add(d.table_of_contents)
    test_session.flush()

    def fin():
        print "finalizer discussion2"
        test_session.delete(d.table_of_contents)
        test_session.delete(d.root_idea)
        test_session.delete(d.next_synthesis)
        preferences = d.preferences
        d.preferences = None
        test_session.delete(preferences)
        test_session.delete(d)
        test_session.flush()
    request.addfinalizer(fin)
    return d
