from pyramid.view import view_config
from pyramid.httpexceptions import (HTTPOk)

from assembl.auth import (P_READ, P_ADMIN_DISC)
from assembl.models import (Discussion)
from ..traversal import InstanceContext
from . import JSON_HEADER


@view_config(context=InstanceContext, request_method='GET',
             ctx_instance_class=Discussion, permission=P_READ,
             accept="application/json", name="settings",
             renderer='json')
def discussion_settings_get(request):
    return request.context._instance.settings_json


@view_config(context=InstanceContext, request_method='PUT',
             ctx_instance_class=Discussion, permission=P_ADMIN_DISC,
             header=JSON_HEADER, name="settings")
def discussion_settings_put(request):
    request.context._instance.settings_json = request.json_body
    return HTTPOk()


@view_config(context=InstanceContext, renderer='json', name="jsonld",
             ctx_instance_class=Discussion, request_method='GET',
             permission=P_READ, accept="application/ld+json")
@view_config(context=InstanceContext, renderer='json',
             ctx_instance_class=Discussion, request_method='GET',
             permission=P_READ, accept="application/ld+json")
def discussion_instance_view_jsonld(request):
    from assembl.semantic.virtuoso_mapping import AssemblQuadStorageManager
    aqsm = AssemblQuadStorageManager()
    discussion = request.context._instance
    return aqsm.as_jsonld(discussion.id)
