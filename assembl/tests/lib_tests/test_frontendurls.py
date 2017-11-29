from graphql_relay.node.node import to_global_id


def test_get_frontend_route_post(discussion, idea_with_en_fr, reply_post_1):
    from assembl.lib.frontend_urls import FrontendUrls
    route_name = "post"
    furl = FrontendUrls(discussion)

    ideaId = to_global_id('Idea', idea_with_en_fr.id)
    element = to_global_id('AssemblPost', reply_post_1)

    options = {
        'slug': discussion.slug,
        'phase': 'thread',
        'themeId': ideaId,
        'element': element
    }
    resp = furl.get_frontend_url(route_name, **options)
    expected = "/{slug}/debate/thread/theme/{themeId}/#{element}".format(
        slug=discussion.slug, themeId=ideaId, element=element)
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
