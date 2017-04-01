import pytest


def discussion_route(slug, *args):
    return ("/%s/" % slug) + "/".join(s.strip("/") for s in args)


def test_route_paths(discussion, test_app, test_adminuser_webrequest):
    assert test_adminuser_webrequest.route_path(
        'contextual_login',
        discussion_slug=discussion.slug
    ) == '/%s/login' % discussion.slug


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

def test_route_discussion_show_allproviders(discussion, test_app):
    """/slug/login_showallproviders"""
    slug = discussion.slug

    # Not logged in
    route = discussion_route(slug, "login_showallproviders")
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_discussion_register(discussion, test_app):
    """/slug/register"""
    slug = discussion.slug

    # Not logged in
    route = discussion_route(slug, "register")
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_discussion_register(discussion, test_app):
    """/slug/register"""
    slug = discussion.slug

    # Not logged in
    route = discussion_route(slug, "register")
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_discussion_post(discussion, root_post_1, test_app):
    """/slug/posts/%id"""
    slug = discussion.slug

    from urllib import quote_plus
    # Encode the URL so that it is compatible with URLs
    url_post_id = quote_plus(root_post_1.uri())
    route = discussion_route(slug, "posts", url_post_id)
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_discussion_idea(discussion, root_post_1, subidea_1, test_app):
    """/slug/idea/%id"""
    slug = discussion.slug

    from urllib import quote_plus
    # Encode the URL so that it is compatible with URLs
    url_post_id = quote_plus(subidea_1.uri())
    route = discussion_route(slug, "idea", url_post_id)
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_admin(test_app):
    """/admin"""
    # if not logged in, should be forbidden

    route = discussion_route(slug, "admin")
    resp = test_app.get(route)
    assert resp.status_int == 403

def test_route_admin_sysadmin_login(test_app, admin_user):
    """/admin"""

    # must login first as a sysadmin
    # test_app.post("/login", {
    #         'identifier': admin_user.email,
    #         'password': 'password'
    #     })

    route = discussion_route(slug, "admin")
    resp = test_app.get(route)
    assert resp.status_int != 200

def test_route_admin_discussion(discussion, test_app):
    """/admin/discussions/"""

    # This route must be terminated in slash.
    # TODO: If this is not by design, fix it
    route = discussion_route(slug, "admin", "discussions") + "/"
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_admin_discussion_permissions(discussion, test_app):
    """/admin/permissions"""

    route = discussion_route(slug, "admin", "permissions")
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_admin_permission_edit(discussion, test_app):
    """/admin/permissions/edit/*id"""

    discussion_id = discussion.id
    route = discussion_route(slug, "admin", "permissions", "edit", discussion_id)
    resp = test_app.get(route)
    assert resp.status_int == 200    
