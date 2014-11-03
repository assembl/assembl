from simplejson import loads

from pyramid.view import view_config
from pyramid.security import authenticated_userid
from pyramid.httpexceptions import (
    HTTPOk, HTTPNoContent, HTTPNotFound, HTTPUnauthorized)

from assembl.auth import (
    P_READ, P_ADMIN_DISC, Everyone)
from assembl.models import (
    User, Discussion, NotificationSubscription, Notification)
from assembl.auth.util import get_permissions
from ..traversal import InstanceContext, ClassContext
from . import FORM_HEADER, JSON_HEADER, instance_put


@view_config(context=ClassContext, renderer='json', request_method='GET',
             ctx_class=NotificationSubscription, permission=P_READ,
             accept="application/json", name="preview")
def notification_subscription_preview(request):
    return "Hello world"

@view_config(context=InstanceContext, renderer='json', request_method='GET',
             ctx_instance_class=Notification, permission=P_READ,
             accept="application/json", name="mail_preview")
def mail_preview(request):
    return "Future mail preview of notifications"
