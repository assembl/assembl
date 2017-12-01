import pytest

backbone_prefix = "/debate/"
react_prefix = "/"


def discussion_route(*args, **kwargs):
    use_backbone = kwargs.get('backbone', True)
    prefix = backbone_prefix if use_backbone else react_prefix
    return prefix + "/".join(args)


def assert_path(request, match, route_name, **kwargs):
    assert request.route_path(route_name, **kwargs) == match


def test_route_paths(discussion, test_app, test_adminuser_webrequest):
    req = test_adminuser_webrequest
    slug = discussion.slug

    assert_path(req, '/%s/home' % slug, 'new_home', discussion_slug=slug)
    assert_path(req, '/debate/%s/login' % slug,
                'contextual_login', discussion_slug=slug)


def test_route_discussion_root(
        discussion, test_app, test_adminuser_webrequest):
    """/slug"""
    slug = discussion.slug

    route = "/%s" % slug
    original = discussion.preferences['landing_page']
    discussion.preferences['landing_page'] = False
    discussion.db.commit()
    resp = test_app.get(route)
    assert resp.status_int == 307
    assert resp.location == test_adminuser_webrequest.route_url(
        'home', discussion_slug=discussion.slug)

    discussion.preferences['landing_page'] = True
    discussion.db.commit()
    resp = test_app.get(route)
    assert resp.status_int == 200
    discussion.preferences['landing_page'] = original
    discussion.db.commit()


def test_route_discussion_root_redirector(discussion, test_app):
    """/slug/ redirects to /slug"""
    slug = discussion.slug

    route = discussion_route(slug, '', backbone=True)
    resp = test_app.get(route)
    assert resp.status_int == 301


@pytest.mark.xfail
def test_route_discussion_home(discussion, test_app):
    """/slug/home"""
    slug = discussion.slug

    route = discussion_route(slug, "home")
    resp = test_app.get(route)
    assert resp.status_int == 200


def test_route_discussion_login(discussion, test_app):
    """/slug/login"""
    slug = discussion.slug

    route = discussion_route(slug, "login")
    resp = test_app.get(route)
    assert resp.status_int == 200
    test_app.cookiejar.clear()


def test_route_discussion_user_profile(discussion, test_app):
    """/slug/user/profile"""
    slug = discussion.slug

    route = discussion_route(slug, "user", "profile", backbone=True)
    resp = test_app.get(route)
    assert resp.status_int == 200


def test_route_discussion_partner(discussion, test_app):
    """/slug/partner"""
    slug = discussion.slug

    route = discussion_route(slug, "partners", backbone=True)
    resp = test_app.get(route)
    assert resp.status_int == 200


def test_route_discussion_about(discussion, test_app):
    """/slug/about"""
    slug = discussion.slug

    route = discussion_route(slug, "about", backbone=True)
    resp = test_app.get(route)
    assert resp.status_int == 200


def test_route_discussion_preferences(discussion, test_app):
    """/slug/discussion_preferences"""
    slug = discussion.slug

    route = discussion_route(slug, "discussion_preferences", backbone=True)
    resp = test_app.get(route)
    assert resp.status_int == 200


def test_route_discussion_settings(discussion, test_app):
    """/slug/settings"""
    slug = discussion.slug

    route = discussion_route(slug, "settings", backbone=True)
    resp = test_app.get(route)
    assert resp.status_int == 200


def test_route_discussion_user_notification(discussion, test_app):
    """/slug/user/notifications"""
    slug = discussion.slug

    route = discussion_route(slug, "user", "notifications", backbone=True)
    resp = test_app.get(route)
    assert resp.status_int == 200


def test_route_discussion_user_account(discussion, test_app):
    """/slug/user/account"""
    slug = discussion.slug

    route = discussion_route(slug, "user", "account", backbone=True)
    resp = test_app.get(route)
    assert resp.status_int == 200


def test_route_discussion_user_discussion_preferences(discussion, test_app):
    """/slug/user/discussion_preferences"""
    slug = discussion.slug

    route = discussion_route(slug, "user", "discussion_preferences", backbone=True)
    resp = test_app.get(route)
    assert resp.status_int == 200


def test_route_discussion_edition(discussion, test_app):
    """/slug/edition"""
    slug = discussion.slug

    route = discussion_route(slug, "edition", backbone=True)
    resp = test_app.get(route)
    assert resp.status_int == 200


def test_route_discussion_notifications(discussion, test_app):
    """/slug/notifications"""
    slug = discussion.slug

    route = discussion_route(slug, "notifications", backbone=True)
    resp = test_app.get(route)
    assert resp.status_int == 200


def test_route_discussion_styleguide(discussion, test_app):
    """/slug/styleguide"""
    slug = discussion.slug

    route = discussion_route(slug, "styleguide", backbone=True)
    resp = test_app.get(route)
    assert resp.status_int == 200


def test_route_logout(test_app):
    """/logout"""

    # Not logged in
    route = "/legacy/logout"
    resp = test_app.get(route)
    assert resp.status_int == 302


def test_route_discussion_logout(discussion, test_app):
    """/logout"""
    slug = discussion.slug

    # Not logged in
    route = discussion_route(slug, "logout", backbone=True)
    resp = test_app.get(route)
    assert resp.status_int == 302


def test_route_discussion_show_allproviders(discussion, test_app):
    """/slug/login_showallproviders"""
    slug = discussion.slug

    # Not logged in
    route = discussion_route(slug, "login_showallproviders")
    resp = test_app.get(route)
    assert resp.status_int == 200
    test_app.cookiejar.clear()


def test_route_discussion_register(discussion, test_app):
    """/slug/register"""
    slug = discussion.slug

    # Not logged in
    route = discussion_route(slug, "register", backbone=True)
    resp = test_app.get(route)
    assert resp.status_int == 200
    test_app.cookiejar.clear()


def test_route_discussion_post_legacy(discussion, root_post_1, test_app):
    """/slug/posts/%id"""
    slug = discussion.slug

    from urllib import quote_plus
    # Encode the URL so that it is compatible with URLs
    url_post_id = quote_plus(root_post_1.uri())
    route = discussion_route(slug, "posts", url_post_id)
    resp = test_app.get(route)
    assert resp.status_int == 200


def test_route_discussion_post(discussion, root_post_1, test_app):
    """/debate/slug/posts/%id"""
    slug = discussion.slug

    from urllib import quote_plus
    # Encode the URL so that it is compatible with URLs
    url_post_id = quote_plus(root_post_1.uri())
    route = discussion_route(slug, "posts", url_post_id, backbone=True)
    resp = test_app.get(route)
    assert resp.status_int == 200


def test_route_discussion_idea_legacy(discussion, root_post_1, subidea_1,
                                      test_app):
    """/slug/idea/%id"""
    slug = discussion.slug

    from urllib import quote_plus
    # Encode the URL so that it is compatible with URLs
    url_post_id = quote_plus(subidea_1.uri())
    route = discussion_route(slug, "idea", url_post_id)
    resp = test_app.get(route)
    assert resp.status_int == 200


def test_route_discussion_idea(discussion, root_post_1, subidea_1, test_app):
    """/debate/slug/idea/%id"""
    slug = discussion.slug

    from urllib import quote_plus
    # Encode the URL so that it is compatible with URLs
    url_post_id = quote_plus(subidea_1.uri())
    route = discussion_route(slug, "idea", url_post_id, backbone=True)
    resp = test_app.get(route)
    assert resp.status_int == 200


def test_route_admin(discussion, test_app_no_login):
    """/admin"""
    # if not logged in, should be forbidden

    route = "/admin"
    resp = test_app_no_login.get(route, expect_errors=True)
    assert resp.status_int != 200


def test_route_admin_sysadmin_login(discussion, test_app, admin_user):
    """/admin"""

    route = "/admin"
    resp = test_app.get(route)
    assert resp.status_int == 200


def test_route_admin_discussion(test_app):
    """/admin/discussions/"""

    # This route must be terminated in slash.
    # TODO: If this is not by design, fix it
    route = "/admin/discussions/"
    resp = test_app.get(route)
    assert resp.status_int == 200


def test_route_admin_discussion_permissions(test_app):
    """/admin/permissions"""

    route = "/admin/permissions"
    resp = test_app.get(route)
    assert resp.status_int == 200


def test_route_admin_permission_edit(discussion, test_app):
    """/admin/permissions/edit/*id"""

    discussion_id = discussion.id
    route = "/admin/permissions/discussion/%d" % (discussion_id,)
    resp = test_app.get(route)
    assert resp.status_int == 200


def test_url_to_post_v1_with_timeline(discussion, root_post_1,
                                      timeline_phase2_interface_v1):
    from assembl.lib.frontend_urls import (
        FrontendUrls,
        get_current_phase_identifier,
        current_phase_use_v1_interface
    )
    frontend_urls = FrontendUrls(discussion)
    assert get_current_phase_identifier(discussion.timeline_events) == u'thread'
    assert current_phase_use_v1_interface(discussion.timeline_events) is True
    assert '/debate/jacklayton2/posts/local' in frontend_urls.get_post_url(root_post_1)


def test_url_to_synthesis_post_with_timeline(discussion, synthesis_post_1,
                                             timeline_phase2_interface_v2):
    from assembl.lib.frontend_urls import (
        FrontendUrls,
        get_current_phase_identifier,
        current_phase_use_v1_interface
    )
    from graphene.relay import Node
    frontend_urls = FrontendUrls(discussion)
    assert get_current_phase_identifier(discussion.timeline_events) ==\
        u'thread'
    assert current_phase_use_v1_interface(discussion.timeline_events) is False
    post_id = Node.to_global_id('Post', synthesis_post_1.id)
    assert '/syntheses/{id}'.format(id=post_id)\
        in frontend_urls.get_post_url(synthesis_post_1)


def test_url_to_post_v1_without_timeline(discussion, root_post_1):
    from assembl.lib.frontend_urls import (
        FrontendUrls,
        get_current_phase_identifier,
        current_phase_use_v1_interface
    )
    frontend_urls = FrontendUrls(discussion)
    assert get_current_phase_identifier(discussion.timeline_events) ==\
        u'thread'
    assert current_phase_use_v1_interface(discussion.timeline_events) is True
    assert '/debate/jacklayton2/posts/local' in\
        frontend_urls.get_post_url(root_post_1)


# this test fail because get_current_request() is returning None
#def test_url_to_post_v2_orphan_post(discussion, root_post_1, timeline_phase2_interface_v2):
#    assert get_current_phase_identifier(discussion.timeline_events) == u'thread'
#    assert current_phase_use_v1_interface(discussion.timeline_events) is False
#    frontend_urls = FrontendUrls(discussion)
#    # orphan posts in v2 not implemented, redirect to home
#    assert 'jacklayton2/debate/home' in frontend_urls.get_post_url(root_post_1)


def test_url_to_post_v2(discussion, root_post_en_under_positive_column_of_idea,
                        timeline_phase2_interface_v2):
    from assembl.lib.frontend_urls import (
        FrontendUrls,
        get_current_phase_identifier,
        current_phase_use_v1_interface
    )
    assert get_current_phase_identifier(discussion.timeline_events) ==\
        u'thread'
    assert current_phase_use_v1_interface(discussion.timeline_events) is False
    frontend_urls = FrontendUrls(discussion)
    assert 'jacklayton2/debate/thread/theme/' in \
        frontend_urls.get_post_url(root_post_en_under_positive_column_of_idea)


def test_url_to_post_v2_proposal(discussion, proposals_en_fr,
                                 timeline_phase2_interface_v2):
    from assembl.lib.frontend_urls import (
        FrontendUrls,
        get_current_phase_identifier,
        current_phase_use_v1_interface
    )
    assert get_current_phase_identifier(discussion.timeline_events) ==\
        u'thread'
    assert current_phase_use_v1_interface(discussion.timeline_events) is False
    frontend_urls = FrontendUrls(discussion)
    expected = 'jacklayton2/debate/thread/theme/'
    actual = frontend_urls.get_post_url(proposals_en_fr[0])
    assert expected in actual
