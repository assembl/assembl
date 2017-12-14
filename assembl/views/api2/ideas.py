from pyramid.view import view_config
from pyramid.httpexceptions import (
    HTTPUnauthorized)
from pyramid.security import Everyone

from ..traversal import (InstanceContext)
from assembl.auth import (CrudPermissions, P_EDIT_IDEA)
from assembl.auth.util import get_permissions
from assembl.models import (Idea)


@view_config(context=InstanceContext, request_method='DELETE', renderer='json',
             ctx_instance_class=Idea, permission=P_EDIT_IDEA)
def instance_del(request):
    ctx = request.context
    user_id = request.authenticated_userid or Everyone
    permissions = get_permissions(
        user_id, ctx.get_discussion_id())
    idea = ctx._instance
    if not idea.user_can(user_id, CrudPermissions.DELETE, permissions):
        return HTTPUnauthorized()
    for link in idea.source_links:
        link.is_tombstone = True
    idea.is_tombstone = True

    return {}
