from simplejson import loads

from pyramid.view import view_config
from pyramid.security import authenticated_userid
from pyramid.httpexceptions import (
    HTTPOk, HTTPNoContent, HTTPNotFound, HTTPUnauthorized)

from assembl.auth import (
    P_READ, P_ADMIN_DISC, Everyone)
from assembl.models import (
    User, Discussion, Idea)
from assembl.auth.util import get_permissions
from ..traversal import InstanceContext, CollectionContext
from . import FORM_HEADER, JSON_HEADER, instance_put


@view_config(context=InstanceContext, renderer='json', request_method='GET',
             ctx_instance_class=Discussion, permission=P_READ,
             accept="application/json", name="notifications")
def discussion_notifications(request):
    return list(request.context._instance.get_notifications())
