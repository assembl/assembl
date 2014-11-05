from simplejson import dumps

from pyramid.view import view_config
from pyramid.security import authenticated_userid
from pyramid.response import Response
from pyramid.httpexceptions import (
    HTTPUnauthorized, HTTPBadRequest)

from assembl.auth import (
    P_READ, P_SYSADMIN)
from assembl.models import (
    NotificationSubscription, Notification)
from assembl.auth.util import get_permissions
from ..traversal import CollectionContext
from . import JSON_HEADER


@view_config(context=CollectionContext, renderer='json', request_method='GET',
             ctx_collection_class=Notification, permission=P_READ,
             accept="application/json")
def view_notification_collection(request):
    ctx = request.context
    view = request.GET.get('view', None) or ctx.get_default_view() or 'default'
    q = ctx.create_query(view == 'id_only')
    if view == 'id_only':
        return [ctx.collection_class.uri_generic(x) for (x,) in q.all()]
    else:
        return [i.generic_json(view) for i in q.all()]


@view_config(context=CollectionContext, renderer='json', request_method='GET',
             ctx_collection_class=NotificationSubscription, permission=P_READ,
             accept="application/json")
def view_notification_subscription_collection(request):
    ctx = request.context
    view = request.GET.get('view', None) or ctx.get_default_view() or 'default'
    q = ctx.create_query(view == 'id_only')
    if view == 'id_only':
        return [ctx.collection_class.uri_generic(x) for (x,) in q.all()]
    else:
        return [i.generic_json(view) for i in q.all()]


@view_config(context=CollectionContext, request_method='POST',
             header=JSON_HEADER,
             ctx_collection_class=NotificationSubscription)
def notif_collection_add_json(request):
    ctx = request.context
    typename = ctx.collection_class.external_typename()
    user_id = authenticated_userid(request)
    typename = request.json_body.get(
        '@type', ctx.collection_class.external_typename())
    permissions = get_permissions(
        user_id, ctx.get_discussion_id())
    if P_SYSADMIN not in permissions:
        cls = ctx.get_collection_class(typename)
        if cls.crud_permissions.create not in permissions:
            raise HTTPUnauthorized()
    json = request.json_body
    try:
        instances = ctx.create_object(typename, json, user_id)
    except Exception as e:
        raise HTTPBadRequest(e)
    if instances:
        first = instances[0]
        db = first.db()
        for instance in instances:
            db.add(instance)
        db.flush()
        view = request.GET.get('view', None) or 'default'
        return Response(
            dumps(first.generic_json(view)),
            location=first.uri_generic(first.id),
            status_code=201)
