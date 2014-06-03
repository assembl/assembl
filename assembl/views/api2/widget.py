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
    view = (request.matchdict or {}).get('view', None) or ctx.get_default_view() or 'default'
    json = ctx._instance.generic_json(view)
    user_id = authenticated_userid(request) or Everyone
    if user_id != Everyone:
        user = User.get(id=user_id)
        json['user'] = user.generic_json(view_def_name=view)
        json['user_permissions'] = get_permissions(
            user_id, ctx._instance.get_discussion_id())
    return json
