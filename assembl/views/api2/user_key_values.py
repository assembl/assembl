from simplejson import dumps, loads

from pyramid.view import view_config
from pyramid.httpexceptions import (
    HTTPCreated, HTTPNotFound, HTTPBadRequest)
from pyramid.security import Everyone

from assembl.auth import (
    P_READ, IF_OWNED, Everyone, CrudPermissions)
from assembl.auth.util import get_permissions
from assembl.semantic.virtuoso_mapping import get_virtuoso
from assembl.models import (
    User, Discussion, TombstonableMixin)
from assembl.models.user_key_values import *
from . import JSON_HEADER
from ..traversal import (
    UserBoundNamespacedDictContext, UserNSBoundDictContext,
    UserNSKeyBoundDictItemContext)


@view_config(context=UserBoundNamespacedDictContext, renderer='json',
             request_method='GET', permission=P_READ)
def view_namespaces(request):
    user_b_nskvdict = request.context.as_collection()
    return list(iter(user_b_nskvdict))


@view_config(context=UserNSBoundDictContext, renderer='json',
             request_method='GET', permission=P_READ)
def view_dict(request):
    user_ns_b_kvdict = request.context.collection
    return dict(user_ns_b_kvdict)


@view_config(context=UserNSBoundDictContext, renderer='json',
             request_method='PATCH', permission=P_READ)
def patch_dict(request):
    user_ns_b_kvdict = request.context.collection
    if not isinstance(request.json, dict):
        raise HTTPBadRequest()
    for k, v in request.json.iteritems():
        user_ns_b_kvdict[k] = v
    return dict(user_ns_b_kvdict)


@view_config(context=UserNSBoundDictContext, renderer='json',
             request_method='DELETE', permission=P_READ)
def clear_namespace(request):
    ctx = request.context
    user_ns_b_kvdict = ctx.collection
    user_b_nskvdict = ctx.__parent__.as_collection()
    del user_b_nskvdict[user_ns_b_kvdict.namespace]
    return {}


@view_config(context=UserNSKeyBoundDictItemContext, renderer='json',
             request_method='GET', permission=P_READ)
def get_value(request):
    ctx = request.context
    user_ns_b_kvdict = ctx.collection
    try:
        return user_ns_b_kvdict[ctx.key]
    except IndexError:
        raise HTTPNotFound()


@view_config(context=UserNSKeyBoundDictItemContext, renderer='json',
             request_method='PUT', permission=P_READ, header=JSON_HEADER)
def put_value(request):
    ctx = request.context
    value = request.json
    user_ns_b_kvdict = ctx.collection
    user_ns_b_kvdict[ctx.key] = value
    return HTTPCreated()


@view_config(context=UserNSKeyBoundDictItemContext, renderer='json',
             request_method='DELETE', permission=P_READ, header=JSON_HEADER)
def del_value(request):
    ctx = request.context
    user_ns_b_kvdict = ctx.collection
    del user_ns_b_kvdict[ctx.key]
    return {}
