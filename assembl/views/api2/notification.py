from simplejson import dumps

from pyramid.view import view_config
from pyramid.security import authenticated_userid
from pyramid.response import Response
from pyramid.httpexceptions import (
    HTTPOk, HTTPUnauthorized, HTTPBadRequest)

from assembl.auth import (
    P_READ, P_SYSADMIN, P_ADMIN_DISC)
from assembl.models import (
    NotificationSubscription, Notification, Discussion)
from assembl.auth.util import get_permissions
from ..traversal import CollectionContext, InstanceContext, ClassContext
from . import JSON_HEADER, instance_put_json


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
    templates = ctx.find_collection(
        'CollectionDefinition.user_templates')
    if templates:
        templates.parent_instance.reset_participant_default_subscriptions(False)
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


@view_config(context=InstanceContext, request_method='GET',
             ctx_instance_class=Notification, permission=P_READ,
             accept="text/html", name="mail_html_preview")
def mail_html_preview(request):
    return Response(request.context._instance.render_to_email_html_part(),
                    content_type='text/html')


@view_config(context=InstanceContext, request_method='GET',
             ctx_instance_class=Notification, permission=P_READ,
             accept="text/html", name="mail_text_preview")
def mail_text_preview(request):
    return Response(request.context._instance.render_to_email_text_part(),
                    content_type='text/plain')


@view_config(context=InstanceContext, request_method='GET',
             ctx_instance_class=Notification, permission=P_READ,
             accept="text/html", name="mail")
def mail(request):
    return Response(request.context._instance.render_to_email(),
                    content_type='text/plain')


@view_config(context=InstanceContext, request_method='GET',
             ctx_instance_class=Notification, permission=P_READ,
             accept="text/plain", name="process_now")
def process_now(request):
    from ...tasks.notify import notify
    notify.delay(request.context._instance.id)
    return Response("Celery notified to process notification " +
                    str(request.context._instance.id),
                    content_type='text/plain')


@view_config(context=ClassContext, request_method='GET',
             ctx_class=Notification, permission=P_READ,
             accept="text/plain", name="process_now")
def process_all_now(request):
    from ...tasks.notify import process_pending_notifications
    process_pending_notifications.delay()
    return Response("Celery notified to process all notifications",
                    content_type='text/plain')


@view_config(context=InstanceContext, request_method='PUT',
    ctx_instance_class=NotificationSubscription,
    header=JSON_HEADER, renderer='json')
def put_notification_request(request):
    result = instance_put_json(request)
    templates = request.context.find_collection(
        'CollectionDefinition.user_templates')
    if templates:
        templates.parent_instance.reset_participant_default_subscriptions()
    return result


@view_config(context=InstanceContext, request_method='GET',
             ctx_instance_class=Discussion, permission=P_ADMIN_DISC,
             name="reset_default_subscriptions")
def reset_default_subscriptions(request):
    request.context._instance.reset_participant_default_subscriptions()
    return HTTPOk()
