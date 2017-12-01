import pytest
from graphql_relay.node.node import to_global_id


def test_get_frontend_route_post(discussion, idea_with_en_fr, reply_post_1):
    from assembl.lib.frontend_urls import FrontendUrls
    route_name = "post"
    furl = FrontendUrls(discussion)

    idea_id = to_global_id('Idea', idea_with_en_fr.id)
    element = to_global_id('Post', reply_post_1)

    options = {
        'slug': discussion.slug,
        'phase': 'thread',
        'themeId': idea_id,
        'element': element
    }
    resp = furl.get_frontend_url(route_name, **options)
    expected = "/{slug}/debate/thread/theme/{themeId}/#{element}".format(
        slug=discussion.slug, themeId=idea_id, element=element)
    assert resp == expected


def test_get_frontend_route_none(discussion, idea_with_en_fr, reply_post_1):
    from assembl.lib.frontend_urls import FrontendUrls
    route_name = None
    route_name_2 = ""
    route_name_3 = "I definitely don't exist"

    furl = FrontendUrls(discussion)

    resp = furl.get_frontend_url(route_name)
    assert resp is None

    resp = furl.get_frontend_url(route_name_2)
    assert resp is None

    resp = furl.get_frontend_url(route_name_3)
    assert resp is None


def test_get_route_react_backend(discussion, test_webrequest):
    from assembl.views import create_get_route
    slug = discussion.slug
    get_route = create_get_route(test_webrequest, discussion)
    kwargs = {'extra_path': ''}
    assert get_route('react_general_page', **kwargs) == \
        "/{slug}/".format(slug=slug)


def test_get_route_react_backend_login(discussion, test_webrequest):
    from assembl.views import create_get_route
    # Despite not being discussion route, need to test a code_path that
    # checks for discussion's existence
    get_route = create_get_route(test_webrequest, discussion)
    assert get_route('furl_login') == "/login"


def test_get_route_react_frontend_join(discussion, test_webrequest):
    from assembl.views import create_get_route
    slug = discussion.slug
    get_route = create_get_route(test_webrequest, discussion)
    assert get_route('furl_join') == "/{slug}/join".format(slug=slug)


def test_get_route_react_frontend_post(discussion, test_webrequest,
                                       idea_with_en_fr, reply_post_1):
    from assembl.views import create_get_route
    get_route = create_get_route(test_webrequest, discussion)
    idea_id = to_global_id('Idea', idea_with_en_fr.id)
    element = to_global_id('Post', reply_post_1)

    options = {
        'phase': 'thread',
        'themeId': idea_id,
        'element': element
    }

    expected = "/{slug}/debate/{phase}/theme/{theme_id}/#{element}"\
        .format(
            slug=discussion.slug,
            phase='thread',
            theme_id=idea_id,
            element=element
        )
    assert get_route('furl_post', **options) == expected


def test_get_route_react_frontend_post_no_element(
        discussion, test_webrequest, idea_with_en_fr, reply_post_1):
    from assembl.views import create_get_route
    get_route = create_get_route(test_webrequest, discussion)
    idea_id = to_global_id('Idea', idea_with_en_fr.id)

    options = {
        'phase': 'thread',
        'themeId': idea_id,
        'element': ''
    }

    expected = "/{slug}/debate/{phase}/theme/{theme_id}/#{element}"\
        .format(
            slug=discussion.slug,
            phase='thread',
            theme_id=idea_id,
            element=""
        )
    assert get_route('furl_post', **options) == expected


def test_get_route_react_frontend_profile(discussion, test_webrequest,
                                          participant1_user):
    from assembl.views import create_get_route
    slug = discussion.slug
    user_id = to_global_id('AgentProfile', participant1_user.id)

    get_route = create_get_route(test_webrequest, discussion)
    expected = "/{slug}/profile/{user_id}".format(
        slug=slug, user_id=user_id)

    assert get_route('furl_profile', userId=user_id) == expected


def test_get_route_react_frontend_does_not_exist(discussion, test_webrequest):
    from assembl.views import create_get_route
    get_route = create_get_route(test_webrequest, discussion)
    with pytest.raises(KeyError):
        get_route('react_i_really_dont_exist')


def test_get_route_v1(discussion, test_webrequest):
    from assembl.views import create_get_route
    slug = discussion.slug
    get_route = create_get_route(test_webrequest, discussion)
    expected = "/debate/{slug}/user/profile".format(slug=slug)
    assert get_route('profile') == expected


def test_get_timeline_for_date_phase2(discussion,
                                      timeline_phase2_interface_v2):
    from assembl.lib.frontend_urls import get_timeline_for_date
    # Ensuring to be in phase 2
    date = '20251231T09:00:00'
    phase = get_timeline_for_date(discussion, date)
    assert phase.identifier == u'thread'


def test_get_timeline_for_date_before_start(discussion,
                                            timeline_phase2_interface_v2):
    from assembl.lib.frontend_urls import get_timeline_for_date
    # Ensuring to be in phase 2
    date = '20051231T09:00:00'
    phase = get_timeline_for_date(discussion, date)
    assert phase is None


def test_get_timeline_for_date_after_end(discussion,
                                         timeline_phase2_interface_v2):
    from assembl.lib.frontend_urls import get_timeline_for_date
    # Ensuring to be in phase 2
    date = '20501231T09:00:00'
    phase = get_timeline_for_date(discussion, date)
    assert phase is None
