import os.path

from pyramid.view import view_config, view_defaults
from pyramid.response import Response
from pyramid.renderers import render_to_response
from pyramid.security import authenticated_userid, Everyone, Authenticated
from assembl.auth import P_SYSADMIN, R_SYSADMIN, P_ADMIN_DISC
from assembl.models import Discussion, User
from assembl.auth.util import discussions_with_access, user_has_permission, get_roles
from .. import get_default_context

TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'templates')

@view_config(
    route_name='discussion_list', request_method='GET',
    renderer='assembl:templates/discussion_list.jinja2')
def discussion_list_view(request):
    user_id = authenticated_userid(request) or Everyone
    user = None
    if user_id != Everyone:
        user = User.get(id=user_id)
    roles = get_roles(user_id)
    context = get_default_context(request)
    context['discussions'] = []
    discussions = discussions_with_access(Authenticated if user_id == Everyone else user_id)
    for discussion in discussions:
        discussion_context = {
            'topic': discussion.topic,
            'slug': discussion.slug
        }
        if user_has_permission(discussion.id, user_id, P_ADMIN_DISC):
            discussion_context['admin_url'] = request.route_url('discussion_permissions', discussion_id=discussion.id)
        context['discussions'].append(discussion_context)
        if R_SYSADMIN in roles:
            context['discussions_admin_url'] = request.route_url('discussion_admin')
            context['permissions_admin_url'] = request.route_url('general_permissions')
    context['user'] = user
    return context
