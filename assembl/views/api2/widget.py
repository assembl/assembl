from pyramid.view import view_config
from pyramid.security import authenticated_userid

from assembl.auth import P_READ, Everyone
from assembl.models import Widget, User
from assembl.auth.util import get_permissions
from ..traversal import InstanceContext


@view_config(context=InstanceContext, renderer='json', request_method='GET',
             ctx_instance_class=Widget, permission=P_READ, accept="application/json")
def collection_view(request):
    ctx = request.context
    view = (request.matchdict or {}).get('view', None) or '/default'
    view = view[1:]
    json = ctx._instance.generic_json(view)
    user_id = authenticated_userid(request)
    if user_id != Everyone:
        json['user'] = User.uri_generic(user_id)
        json['user_permissions'] = get_permissions(
            user_id, ctx._instance.get_discussion_id())
    return json
