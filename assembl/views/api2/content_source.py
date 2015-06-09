
from pyramid.view import view_config
from pyramid.security import authenticated_userid
from pyramid.httpexceptions import HTTPUnauthorized, HTTPBadRequest

from assembl.auth import (P_READ, P_ADMIN_DISC)
from assembl.models import ContentSource
from assembl.auth.util import get_permissions
from ..traversal import InstanceContext
from . import FORM_HEADER
from assembl.tasks.source_reader import wake

@view_config(context=InstanceContext, request_method='POST',
             ctx_instance_class=ContentSource, permission=P_READ,
             header=FORM_HEADER, renderer='json', name="fetch_posts")
def fetch_posts(request):
    ctx = request.context
    csource = ctx._instance
    force_restart = request.params.get('force_restart', False)
    reimport = request.params.get('reimport', False)
    limit = request.params.get('limit', None)
    if limit:
        try:
            limit = int(limit)
        except ValueError:
            raise HTTPBadRequest("Non-numeric limit value: "+limit)
    if force_restart or reimport or limit:
        # Only discussion admins
        user_id = authenticated_userid(request)
        permissions = get_permissions(
            user_id, ctx.get_discussion_id())
        if P_ADMIN_DISC not in permissions:
            requested = []
            if reimport:
                requested.append('reimport')
            if force_restart:
                requested.append('force restart')
            raise HTTPUnauthorized("Only discussion administrator can "+'and'.join(requested))

    wake(csource.id, reimport, force_restart, limit=limit)
    return {"message":"Source notified",
            "name": csource.name}
