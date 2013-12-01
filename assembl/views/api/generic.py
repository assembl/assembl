import json

from pyramid.httpexceptions import HTTPNotFound
from . import acls
from assembl.view_def import get_view_def

from cornice import Service

from assembl.views.api import API_DISCUSSION_PREFIX

import assembl.models

generic = Service(
    name='generic',
    path=API_DISCUSSION_PREFIX + '/generic/{cls}/{id}{view:(/[^/]+)?}',
    description="Retrieve an arbitrary object.",
    renderer='json', acl=acls)


@generic.get()  # P_ADMIN)
def get_object(request):
    classname = request.matchdict['cls']
    id = request.matchdict['id']
    view = request.matchdict['view'] or '/default'
    view = view[1:]
    cls = getattr(assembl.models, classname, None)
    if not cls:
        raise HTTPNotFound("Class '%s' not found." % classname)
    obj = cls.get(id=id)
    if not obj:
        raise HTTPNotFound("Id %s of class '%s' not found." % (id, classname))
    if not get_view_def(view):
        raise HTTPNotFound("View '%s' not found." % view)

    return obj.generic_json(view)
