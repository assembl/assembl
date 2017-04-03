import pytest

backbone_prefix = "debate"

def discussion_route(slug, *args, **kwargs):
    prefix = kwargs.get('prefix', "")
    prefix = "/" + prefix if (prefix is not "" and not prefix.startswith("/")) else prefix
    return ("%s/%s/" % (prefix, slug)) + "/".join(s.strip("/") if isinstance(s, basestring) else str(s) for s in args)


def assert_path(request, route_name, match, **kwargs):
    assert request.route_path(route_name, **kwargs) == match 

def test_route_paths(discussion, test_app, test_adminuser_webrequest):
    req = test_adminuser_webrequest
    slug = discussion.slug

    assert_path(req, 'landing_page', '/%s/home' % slug, discussion_slug=slug)
    assert_path(req, 'contextual_login', '/%s/login' % slug, discussion_slug=slug)

def test_route_discussion_root(discussion, test_app):
    """/slug"""
    slug = discussion.slug

    route = "/%s" % slug
    resp = test_app.get(route, prefix="debate")
    assert resp.status_int == 200

def test_route_discussion_root_redirector(discussion, test_app):
    """/slug/ redirects to /slug"""
    slug = discussion.slug

    route = discussion_route(slug, prefix="debate")
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

    route = discussion_route(slug, "user", "profile", prefix="debate")
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_discussion_partner(discussion, test_app):
    """/slug/partner"""
    slug = discussion.slug

    route = discussion_route(slug, "partners", prefix="debate")
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_discussion_about(discussion, test_app):
    """/slug/about"""
    slug = discussion.slug

    route = discussion_route(slug, "about", prefix="debate")
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_discussion_preferences(discussion, test_app):
    """/slug/discussion_preferences"""
    slug = discussion.slug

    route = discussion_route(slug, "discussion_preferences", prefix="debate")
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_discussion_settings(discussion, test_app):
    """/slug/settings"""
    slug = discussion.slug

    route = discussion_route(slug, "settings", prefix="debate")
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_discussion_user_notification(discussion, test_app):
    """/slug/user/notifications"""
    slug = discussion.slug

    route = discussion_route(slug, "user", "notifications", prefix="debate")
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_discussion_user_account(discussion, test_app):
    """/slug/user/account"""
    slug = discussion.slug

    route = discussion_route(slug, "user", "account", prefix="debate")
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_discussion_user_discussion_preferences(discussion, test_app):
    """/slug/user/discussion_preferences"""
    slug = discussion.slug

    route = discussion_route(slug, "user", "discussion_preferences", prefix="debate")
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_discussion_edition(discussion, test_app):
    """/slug/edition"""
    slug = discussion.slug

    route = discussion_route(slug, "edition", prefix="debate")
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_discussion_notifications(discussion, test_app):
    """/slug/notifications"""
    slug = discussion.slug

    route = discussion_route(slug, "notifications", prefix="debate")
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_discussion_styleguide(discussion, test_app):
    """/slug/styleguide"""
    slug = discussion.slug

    route = discussion_route(slug, "styleguide", prefix="debate")
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_logout(test_app):
    """/logout"""

    # Not logged in
    route = "/logout"
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_discussion_logout(discussion, test_app):
    """/logout"""
    slug = discussion.slug

    # Not logged in
    route = discussion_route("logout")
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
    route = discussion_route(slug, "posts", url_post_id, prefix="debate")
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_discussion_idea_legacy(discussion, root_post_1, subidea_1, test_app):
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
    route = discussion_route(slug, "idea", url_post_id, prefix="debate")
    resp = test_app.get(route)
    assert resp.status_int == 200

def test_route_admin(test_app):
    """/admin"""
    # if not logged in, should be forbidden

    route = "/admin"
    resp = test_app.get(route)
    assert resp.status_int == 200

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
