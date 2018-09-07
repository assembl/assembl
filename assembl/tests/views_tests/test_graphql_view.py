import simplejson as json
from graphene.relay import Node


def test_graphql_default_request(discussion, test_app, test_webrequest, admin_user, graphql_registry):
    from assembl.views import create_get_route
    get_route = create_get_route(test_webrequest, discussion)
    route = get_route('graphql')
    query = graphql_registry['userQuery']
    parameters = {
        "query": query,
        "variables": {
            "id": admin_user.graphene_id()
        }
    }
    resp = test_app.post(
        route,
        xhr=True,
        content_type='application/json',
        params=json.dumps(parameters)
    )
    assert resp.status_code == 200
    has_cors_header = 'Access-Control-Allow-Origin' in [r[0] for r in resp.headerlist]
    body = json.loads(resp.body)
    user_id = int(Node.from_global_id(body['data']['user']['id'])[1])
    assert user_id == admin_user.id
    assert not has_cors_header


def test_graphql_cors_request(discussion, test_webrequest, admin_user, test_app, test_session, graphql_registry):
    from assembl.views import create_get_route
    get_route = create_get_route(test_webrequest, discussion)
    old_pref = discussion.preferences['graphql_valid_cors']
    cors_headers = "https://mycoolsite.com,https://myothercoolsite.net"  # no space between comma, just as graphql view
    discussion.preferences['graphql_valid_cors'] = cors_headers.split(",")
    test_session.flush()
    route = get_route('graphql')
    query = graphql_registry['userQuery']
    parameters = {
        "query": query,
        "variables": {
            "id": admin_user.graphene_id()
        }
    }
    resp = test_app.post(
        route,
        xhr=True,
        content_type='application/json',
        params=json.dumps(parameters)
    )
    assert resp.status_code == 200
    has_cors_headers = 'Access-Control-Allow-Origin' in [r[0] for r in resp.headerlist]
    body = json.loads(resp.body)
    user_id = int(Node.from_global_id(body['data']['user']['id'])[1])
    assert user_id == admin_user.id
    assert has_cors_headers
    cors_header_list = [x[1] for x in resp.headerlist if x[0] == 'Access-Control-Allow-Origin'][0]
    assert cors_header_list == cors_headers

    discussion.preferences['graphql_valid_cors'] = old_pref
    test_session.flush()


def test_graphql_cors_option_request(discussion, test_webrequest, admin_user, test_app, test_session):
    from assembl.views import create_get_route
    get_route = create_get_route(test_webrequest, discussion)
    old_pref = discussion.preferences['graphql_valid_cors']
    cors_headers = "https://mycoolsite.com,https://myothercoolsite.net"  # no space between comma, just as graphql view
    discussion.preferences['graphql_valid_cors'] = cors_headers.split(",")
    test_session.flush()
    route = get_route('graphql')
    resp = test_app.options(
        route,
        xhr=True
    )
    assert resp.status_code == 200
    has_cors_headers = 'Access-Control-Allow-Origin' in [r[0] for r in resp.headerlist]
    assert has_cors_headers
    cors_header_list = [x[1] for x in resp.headerlist if x[0] == 'Access-Control-Allow-Origin'][0]
    assert cors_header_list == cors_headers

    discussion.preferences['graphql_valid_cors'] = old_pref
    test_session.flush()
