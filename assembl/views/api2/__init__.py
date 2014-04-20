import os

from pyramid.view import view_config
from pyramid.httpexceptions import (
    HTTPCreated, HTTPBadRequest, HTTPNotImplemented, HTTPUnauthorized)
from pyramid.security import authenticated_userid

from assembl.lib.sqla import get_session_maker
from ..traversal import InstanceContext, CollectionContext, ClassContext
from assembl.auth import P_READ, P_SYSADMIN, Everyone
from assembl.auth.util import get_roles, get_permissions

FIXTURE_DIR = os.path.join(
    os.path.dirname(__file__), '..', '..', 'static', 'js', 'tests', 'fixtures')
API_PREFIX = '/data/'

FORM_HEADER = "Content-Type:(application/x-www-form-urlencoded)|(multipart/form-data)"
JSON_HEADER = "Content-Type:application/(.*\+)?json"


def includeme(config):
    """ Initialize views and renderers at app start-up time. """
    config.add_route('csrf_token2', 'Token')


@view_config(context=ClassContext, renderer='json',
             request_method='GET', permission=P_READ)
def class_view(request):
    ctx = request.context
    view = (request.matchdict or {}).get('view', None) or '/id_only'
    view = view[1:]
    q = ctx.create_query(view == 'id_only')
    if view == 'id_only':
        return [ctx._class.uri_generic(x) for (x,) in q.all()]
    else:
        return [i.generic_json(view) for i in q.all()]


@view_config(context=InstanceContext, renderer='json',
             request_method='GET', permission=P_READ)
def instance_view(request):
    ctx = request.context
    view = (request.matchdict or {}).get('view', None) or '/default'
    view = view[1:]
    return ctx._instance.generic_json(view)


@view_config(context=CollectionContext, renderer='json',
             request_method='GET', permission=P_READ)
def collection_view(request):
    ctx = request.context
    view = (request.matchdict or {}).get('view', None) or '/id_only'
    view = view[1:]
    q = ctx.create_query(view == 'id_only')
    if view == 'id_only':
        return [ctx.collection_class.uri_generic(x) for (x,) in q.all()]
    else:
        return [i.generic_json(view) for i in q.all()]


@view_config(context=CollectionContext, request_method='POST',
             header=FORM_HEADER)
def collection_add(request):
    ctx = request.context
    args = request.params
    user_id = authenticated_userid(request)
    typename = args.get('type', ctx.collection_class.external_typename())
    permissions = get_permissions(
        user_id, ctx.parent_instance.get_discussion_id())
    if P_SYSADMIN not in permissions:
        cls = ctx.get_collection_class(typename)
        if cls.crud_permissions.read not in permissions:
            raise HTTPUnauthorized()
    try:
        instances = ctx.create_object(typename, None, **args)
    except Exception as e:
        raise HTTPBadRequest(e)
    if instances:
        db = get_session_maker()
        for instance in instances:
            db.add(instance)
        db.flush()
        first = instances[0]
        raise HTTPCreated(first.uri_generic(first.id))
    raise HTTPBadRequest()


@view_config(context=InstanceContext, request_method='POST')
def instance_post(request):
    raise HTTPBadRequest()


@view_config(context=InstanceContext, request_method='PUT', header=JSON_HEADER)
def instance_put_json(request):
    #TODO
    raise HTTPNotImplemented()


@view_config(context=InstanceContext, request_method='PUT', header=FORM_HEADER)
def instance_put(request):
    #TODO
    raise HTTPNotImplemented()


@view_config(context=InstanceContext, request_method='DELETE')
def instance_del(request):
    # TODO
    raise HTTPNotImplemented()


@view_config(name="collections", context=InstanceContext, renderer='json',
             request_method="GET", permission=P_READ)
def show_collections(request):
    return request.context.get_collection_names()

@view_config(context=ClassContext, request_method='POST', header=FORM_HEADER)
def class_add(request):
    # TODO : Permissions.
    ctx = request.context
    args = request.params
    typename = args.get('type', None)
    cls = ctx.get_class(typename)
    user_id = authenticated_userid(request)
    # In this case, no discussion context, so only sysadmin.
    if R_SYSADMIN not in get_roles(user_id):
        raise HTTPUnauthorized()
    try:
        instances = ctx.create_object(typename, None, **args)
    except Exception as e:
        raise HTTPBadRequest(e)
    if instances:
        db = get_session_maker()
        for instance in instances:
            db.add(instance)
        db.flush()
        first = instances[0]
        raise HTTPCreated(first.uri_generic(first.id))
    raise HTTPBadRequest()


@view_config(context=CollectionContext, request_method='POST',
             header=JSON_HEADER)
def collection_add_json(request):
    # TODO : Permissions.
    ctx = request.context
    typename = ctx.collection_class.external_typename()
    try:
        instances = ctx.create_object(typename, request.json_body)
    except Exception as e:
        raise HTTPBadRequest(e)
    if instances:
        db = get_session_maker()
        for instance in instances:
            db.add(instance)
        db.flush()
        first = instances[0]
        raise HTTPCreated(first.uri_generic(first.id))
