from pyramid.view import view_config

from assembl.auth import (P_READ)
from assembl.models import (Discussion)
from ..traversal import InstanceContext


@view_config(context=InstanceContext, renderer='json', request_method='GET',
             ctx_instance_class=Discussion, permission=P_READ,
             accept="application/json", name="notifications")
def discussion_notifications(request):
    return list(request.context._instance.get_notifications())
