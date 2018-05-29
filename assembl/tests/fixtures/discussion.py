import pytest
from sqlalchemy import inspect

from assembl.auth import P_READ, R_PARTICIPANT


@pytest.fixture(scope="function")
def discussion(request, test_session, default_preferences):
    """An empty Discussion fixture with default preferences"""
    from assembl.models import Discussion, LangString
    from assembl.models import Discussion
#    from assembl.lib.migration import create_default_discussion_data
    with test_session.no_autoflush:
        d = Discussion(
            topic=u"Jack Layton", slug="jacklayton2",
            subscribe_to_notifications_on_signup=False,
            creator=None,
            session=test_session)
        d.discussion_locales = ['en', 'fr', 'de']
        d.legal_notice = LangString.create(
            u"We need to input the optical HDD sensor!", "en")
        tac = LangString.create(
            u"You can't quantify the driver without quantifying the 1080p JSON protocol!", "en")
        tac.add_value(
            u"Vous ne pouvez pas mesurer le driver sans mesurer le protocole JSON en 1080p", u"fr")
        d.terms_and_conditions = tac

        title = LangString.create(
            u"Faut-il manger des bananes ?", u"fr")
        title.add_value(
            u"Should we eat bananas?", u"en")
        d.title = title

        subtitle = LangString.create(
            u"Dis-moi ce que tu manges et je te dirai qui tu es", u"fr")
        subtitle.add_value(
            u"Tell me what you eat and I will tell you who you are", u"en")
        d.subtitle = subtitle

        button_label = LangString.create(
            u"Discuter des bananes", u"fr")
        button_label.add_value(
            u"Discuss bananas", u"en")
        d.button_label = button_label

        test_session.add(d)
        # create_default_discussion_data(d)
        # Don't create default discussion data (permissions, sections) here
        # because it takes too much time to run all tests.
        # If you need sections or permissions in your tests, execute
        # create_default_discussion_data, create_default_discussion_sections
        # or create_default_permissions in your specific test or
        # use discussion_with_default_data fixture.
        # If you do permissions tests, be aware that the admin user
        # having R_SYSADMIN is actually a special case, see
        # auth/utils.py:get_permissions, it doesn't use discussion permissions
        # at all. So you need discussion permissions if you test with the
        # unauthenticated user Everyone or a user not having the R_SYSADMIN role.
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
        for ut in discussion.user_templates:
            for ns in ut.notification_subscriptions:
                ns.delete()
            ut.delete()
        test_session.delete(preferences)
        test_session.delete(discussion)
        test_session.flush()
    request.addfinalizer(fin)
    return d


@pytest.fixture(scope="function")
def discussion_with_default_data(request, discussion, test_session):
    from assembl.lib.migration import create_default_discussion_data
    create_default_discussion_data(discussion)
    test_session.flush()

    def fin():
        for acl in discussion.acls:
            test_session.delete(acl)
        for section in discussion.sections:
            test_session.delete(section)
        test_session.flush()
    request.addfinalizer(fin)
    return discussion


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
        for ut in d.user_templates:
            for ns in ut.notification_subscriptions:
                ns.delete()
            ut.delete()
        preferences = d.preferences
        d.preferences = None
        test_session.delete(preferences)
        test_session.delete(d)
        test_session.flush()
    request.addfinalizer(fin)
    return d


@pytest.fixture(scope="function")
def discussion_with_lang_prefs(request, test_session, discussion):
    """An empty Discussion fixture with locale preferences"""
    discussion.discussion_locales = ['en', 'fr', 'ja']
    test_session.commit()

    return discussion


@pytest.fixture(scope="function")
def closed_discussion(request, test_session, discussion):
    """An empty Discussion fixture restricted-to-social login"""
    from assembl.models import Role, DiscussionPermission, Permission
    from assembl.models.auth import create_default_permissions
    create_default_permissions(discussion)
    test_session.flush()
    discussion.preferences['authorization_server_backend'] = 'google-oauth2'
    role = test_session.query(Role).filter_by(name=R_PARTICIPANT).first()
    # Take the read for everyone, put it on participant
    dp = test_session.query(DiscussionPermission).join(Permission).filter(
        DiscussionPermission.discussion == discussion, Permission.name == P_READ).first()
    dp.role = role
    test_session.commit()

    def fin():
        for acl in discussion.acls:
            test_session.delete(acl)
        test_session.flush()
    request.addfinalizer(fin)
    return discussion


@pytest.fixture(scope="function")
def discussion_with_permissions(request, test_session, discussion):
    """An empty Discussion fixture with default permissions"""
    from assembl.models.auth import create_default_permissions
    create_default_permissions(discussion)
    test_session.flush()

    def fin():
        for ul in discussion.acls:
            ul.delete()
        test_session.flush()
    request.addfinalizer(fin)
    return discussion


@pytest.fixture(scope="function")
def discussion_with_2_phase_interface_v2(
        request, test_session, discussion_with_permissions,
        timeline_phase2_interface_v2):

    discussion_with_permissions.preferences['landing_page'] = True
    test_session.commit()
    return discussion_with_permissions
