"""Cornice API for content"""
from pyramid.httpexceptions import HTTPNotFound
from pyramid.security import Everyone
from cornice import Service

import assembl.models
from assembl.auth import P_READ
from assembl.auth.util import get_permissions
from assembl.view_def import get_view_def
from assembl.views.api import API_DISCUSSION_PREFIX


generic = Service(
    name='generic',
    path=API_DISCUSSION_PREFIX + '/generic/{cls}/{id}{view:(/[^/]+)?}',
    description="Retrieve an arbitrary object.",
    renderer='json')


@generic.get(permission=P_READ)
def get_object(request):
    classname = request.matchdict['cls']
    id = request.matchdict['id']
    view = request.matchdict['view'] or '/default'
    view = view[1:]
    cls = getattr(assembl.models, classname, None)
    if not cls:
        raise HTTPNotFound("Class '%s' not found." % classname)
    obj = cls.get(id)
    if not obj:
        raise HTTPNotFound("Id %s of class '%s' not found." % (id, classname))
    if not get_view_def(view):
        raise HTTPNotFound("View '%s' not found." % view)
    discussion_id = int(request.matchdict['discussion_id'])
    user_id = request.authenticated_userid or Everyone
    permissions = get_permissions(user_id, discussion_id)

    return obj.generic_json(view, user_id, permissions)
