import json
import transaction

from pyramid.security import authenticated_userid
from pyramid.httpexceptions import HTTPUnauthorized
from pyramid.view import view_config
from pyramid.response import Response

from assembl.auth.token import encode_token

_ac = 'Access-Control-'
option_headers = [
    (_ac + 'Allow-Headers', 'X-Requested-With, Content-Type, Content-Length'),
    (_ac + 'Allow-Methods', 'GET, OPTIONS'),
    (_ac + 'Max-Age', '86400')
]


@view_config(route_name='csrf_token', request_method='OPTIONS')
def auth_token_options(request):
    return auth_token(request, option_headers)


@view_config(route_name='csrf_token', request_method='GET')
def auth_token(request, extra_headers={}):
    headers = []
    if 'origin' in request.headers:
        headers.extend([
            (_ac + 'Allow-Origin', request.headers['origin']),
            (_ac + 'Allow-Credentials', 'true'),
            (_ac + 'Expose-Headers', 'Location, Content-Type, Content-Length'),
        ])
        headers.extend(extra_headers)
    user_id = authenticated_userid(request)
    if user_id:
        #user = User.get(id=user_id)
        #c = Consumer.fetch('annotateit')
        payload = {
            'consumerKey': 'assembl-annotator', 'userId': user_id, 'ttl': 86400
        }
        # if g.user.is_admin:
        #     payload['admin'] = True
        token = encode_token(payload, request.registry.settings['session.secret'])
        return Response(token, 200, headers, content_type='text/plain')
    else:
        return HTTPUnauthorized(
            'Please go to {0} to log in!'.format(request.host_url+"/login"),
            headers)
