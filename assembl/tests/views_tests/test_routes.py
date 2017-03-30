import pytest


def discussion_route(slug, *args):
    return ("/%s/" % slug) + "/".join(s.strip("/") for s in args)

def test_route_discussion_root(discussion, test_app):
    """/slug"""
    slug = discussion.slug

    route = "/%s" % slug
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_discussion_root_redirector(discussion, test_app):
    """/slug/ redirects to /slug"""
    slug = discussion.slug

    route = discussion_route(slug)
    resp = test_app.get(route)
    assert resp.status_int == 301

@pytest.mark.xfail
def test_route_discussion_home(discussion, test_app):
    """/slug/home"""
    # TODO: Implement this route!
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

def test_route_discussion_user_profile(discussion, test_app):
    """/slug/user/profile"""
    slug = discussion.slug

    route = discussion_route(slug, "user", "profile")
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_discussion_partner(discussion, test_app):
    """/slug/partner"""
    slug = discussion.slug

    route = discussion_route(slug, "partners")
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_discussion_about(discussion, test_app):
    """/slug/about"""
    slug = discussion.slug

    route = discussion_route(slug, "about")
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_discussion_preferences(discussion, test_app):
    """/slug/discussion_preferences"""
    slug = discussion.slug

    route = discussion_route(slug, "discussion_preferences")
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_discussion_settings(discussion, test_app):
    """/slug/settings"""
    slug = discussion.slug

    route = discussion_route(slug, "settings")
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_discussion_user_notification(discussion, test_app):
    """/slug/user/notifications"""
    slug = discussion.slug

    route = discussion_route(slug, "user", "notifications")
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_discussion_user_account(discussion, test_app):
    """/slug/user/account"""
    slug = discussion.slug

    route = discussion_route(slug, "user", "account")
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_discussion_user_discussion_preferences(discussion, test_app):
    """/slug/user/discussion_preferences"""
    slug = discussion.slug

    route = discussion_route(slug, "user", "discussion_preferences")
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_discussion_edition(discussion, test_app):
    """/slug/edition"""
    slug = discussion.slug

    route = discussion_route(slug, "edition")
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_discussion_notifications(discussion, test_app):
    """/slug/notifications"""
    slug = discussion.slug

    route = discussion_route(slug, "notifications")
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_discussion_styleguide(discussion, test_app):
    """/slug/styleguide"""
    slug = discussion.slug

    route = discussion_route(slug, "styleguide")
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_discussion_logout(discussion, test_app):
    """/slug/styleguide"""
    slug = discussion.slug

    # Not logged in
    route = discussion_route(slug, "styleguide")
    resp = test_app.get(route)
    assert resp.status_int == 200