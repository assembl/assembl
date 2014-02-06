import os.path

from pyramid.view import view_config, view_defaults
from pyramid.response import Response
from pyramid.renderers import render_to_response
from pyramid.security import authenticated_userid, Everyone

from assembl.models import Discussion, User
from assembl.auth import discussions_with_access

TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'templates')

default_context = {
    'STATIC_URL': '/static/'
}

def get_default_context():
    return default_context

@view_config(
    route_name='discussion_list', request_method='GET',
    renderer='assembl:templates/discussion_list.jinja2')
def discussion_list_view(request):
    user_id = authenticated_userid(request) or Everyone
    user = None
    if user_id != Everyone:
        user = User.get(id=user_id)
    context = get_default_context()
    context['discussions'] = discussions_with_access(user_id)
    context['user'] = user
    return context


def includeme(config):
    default_context['socket_url'] = \
        config.registry.settings['changes.websocket.url']
    default_context['cache_bust'] = \
        config.registry.settings['requirejs.cache_bust']
