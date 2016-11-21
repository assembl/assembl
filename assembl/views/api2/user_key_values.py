from simplejson import dumps, loads

from pyramid.view import view_config
from pyramid.httpexceptions import (HTTPNotFound, HTTPBadRequest)
from pyramid.response import Response

from assembl.auth import (
    P_READ, IF_OWNED, Everyone, CrudPermissions)
from assembl.models.user_key_values import *
from . import JSON_HEADER
from ..traversal import (
    UserBoundNamespacedDictContext, UserNSBoundDictContext,
    UserNSKeyBoundDictItemContext, NamespacedDictContext,
    NSBoundDictContext, NSKeyBoundDictItemContext)


@view_config(context=UserBoundNamespacedDictContext, renderer='json',
             request_method='GET', permission=P_READ)
def view_u_namespaces(request):
    user_b_nskvdict = request.context.as_collection()
    return list(iter(user_b_nskvdict))


@view_config(context=UserNSBoundDictContext, renderer='json',
             request_method='GET', permission=P_READ)
def view_u_dict(request):
    user_ns_b_kvdict = request.context.collection
    return dict(user_ns_b_kvdict)


@view_config(context=UserNSBoundDictContext, renderer='json',
             request_method='PATCH', permission=P_READ)
def patch_u_dict(request):
    user_ns_b_kvdict = request.context.collection
    if not isinstance(request.json, dict):
        raise HTTPBadRequest()
    try:
        for k, v in request.json.iteritems():
            if v is None:
                del user_ns_b_kvdict[k]
            else:
                user_ns_b_kvdict[k] = v
    except KeyError:
        raise HTTPNotFound()
    except (AssertionError, ValueError) as e:
        raise HTTPBadRequest(e)
    return dict(user_ns_b_kvdict)


@view_config(context=UserNSBoundDictContext, renderer='json',
             request_method='PUT', permission=P_READ)
def put_u_dict(request):
    user_ns_b_kvdict = request.context.collection
    if not isinstance(request.json, dict):
        raise HTTPBadRequest()
    try:
        for k, v in request.json.iteritems():
            if v is None:
                del user_ns_b_kvdict[k]
            else:
                user_ns_b_kvdict[k] = v
        for k in user_ns_b_kvdict:
            if k not in request.json:
                del user_ns_b_kvdict[k]
    except KeyError:
        raise HTTPNotFound()
    except (AssertionError, ValueError) as e:
        raise HTTPBadRequest(e)
    return dict(user_ns_b_kvdict)


@view_config(context=UserNSBoundDictContext, renderer='json',
             request_method='DELETE', permission=P_READ)
def clear_u_namespace(request):
    ctx = request.context
    user_ns_b_kvdict = ctx.collection
    user_b_nskvdict = ctx.__parent__.as_collection()
    try:
        del user_b_nskvdict[user_ns_b_kvdict.namespace]
    except KeyError:
        raise HTTPNotFound()
    except (AssertionError, ValueError) as e:
        raise HTTPBadRequest(e)
    return {}


@view_config(context=UserNSKeyBoundDictItemContext, renderer='json',
             request_method='GET', permission=P_READ)
def get_u_value(request):
    ctx = request.context
    user_ns_b_kvdict = ctx.collection
    try:
        return user_ns_b_kvdict[ctx.key]
    except KeyError:
        raise HTTPNotFound()


@view_config(context=UserNSKeyBoundDictItemContext, renderer='json',
             request_method='PUT', permission=P_READ, header=JSON_HEADER)
def put_u_value(request):
    ctx = request.context
    value = request.json
    user_ns_b_kvdict = ctx.collection
    try:
        user_ns_b_kvdict[ctx.key] = value
    except KeyError:
        raise HTTPNotFound()
    except (AssertionError, ValueError) as e:
        raise HTTPBadRequest(e)
    return Response(
        dumps(value), status_code=201, content_type='application/json')


@view_config(context=UserNSKeyBoundDictItemContext, renderer='json',
             request_method='DELETE', permission=P_READ)
def del_u_value(request):
    ctx = request.context
    user_ns_b_kvdict = ctx.collection
    try:
        del user_ns_b_kvdict[ctx.key]
    except KeyError:
        raise HTTPNotFound()
    except (AssertionError, ValueError) as e:
        raise HTTPBadRequest(e)
    return {}


@view_config(context=NamespacedDictContext, renderer='json',
             request_method='GET', permission=P_READ)
def view_namespaces(request):
    nskvdict = request.context.as_collection()
    return list(iter(nskvdict))


@view_config(context=NSBoundDictContext, renderer='json',
             request_method='GET', permission=P_READ)
def view_dict(request):
    ns_b_kvdict = request.context.collection
    return dict(ns_b_kvdict)


@view_config(context=NSBoundDictContext, renderer='json',
             request_method='PATCH', permission=P_READ)
def patch_dict(request):
    ns_b_kvdict = request.context.collection
    if not isinstance(request.json, dict):
        raise HTTPBadRequest()
    try:
        for k, v in request.json.iteritems():
            if v is None:
                del ns_b_kvdict[k]
            else:
                ns_b_kvdict[k] = v
    except KeyError:
        raise HTTPNotFound()
    except (AssertionError, ValueError) as e:
        raise HTTPBadRequest(e)
    return dict(ns_b_kvdict)


@view_config(context=NSBoundDictContext, renderer='json',
             request_method='PUT', permission=P_READ)
def put_dict(request):
    ns_b_kvdict = request.context.collection
    if not isinstance(request.json, dict):
        raise HTTPBadRequest()
    try:
        for k, v in request.json.iteritems():
            if v is None:
                del ns_b_kvdict[k]
            else:
                ns_b_kvdict[k] = v
        for k in ns_b_kvdict:
            if k not in request.json:
                del ns_b_kvdict[k]
    except KeyError:
        raise HTTPNotFound()
    except (AssertionError, ValueError) as e:
        raise HTTPBadRequest(e)
    return dict(ns_b_kvdict)


@view_config(context=NSBoundDictContext, renderer='json',
             request_method='DELETE', permission=P_READ)
def clear_namespace(request):
    ctx = request.context
    ns_b_kvdict = ctx.collection
    nskvdict = ctx.__parent__.as_collection()
    try:
        del nskvdict[ns_b_kvdict.namespace]
    except KeyError:
        raise HTTPNotFound()
    except (AssertionError, ValueError) as e:
        raise HTTPBadRequest(e)
    return {}


@view_config(context=NSKeyBoundDictItemContext, renderer='json',
             request_method='GET', permission=P_READ)
def get_value(request):
    ctx = request.context
    ns_b_kvdict = ctx.collection
    try:
        return ns_b_kvdict[ctx.key]
    except KeyError:
        raise HTTPNotFound()


@view_config(context=NSKeyBoundDictItemContext, renderer='json',
             request_method='PUT', permission=P_READ, header=JSON_HEADER)
def put_value(request):
    ctx = request.context
    value = request.json
    ns_b_kvdict = ctx.collection
    try:
        ns_b_kvdict[ctx.key] = value
    except KeyError:
        raise HTTPNotFound()
    except (AssertionError, ValueError) as e:
        raise HTTPBadRequest(e)
    return Response(
        dumps(value), status_code=201, content_type='application/json')


@view_config(context=NSKeyBoundDictItemContext, renderer='json',
             request_method='DELETE', permission=P_READ)
def del_value(request):
    ctx = request.context
    ns_b_kvdict = ctx.collection
    try:
        del ns_b_kvdict[ctx.key]
    except KeyError:
        raise HTTPNotFound()
    except (AssertionError, ValueError) as e:
        raise HTTPBadRequest(e)
    return {}
