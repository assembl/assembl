"""RESTful API to assembl, with some magic.
The basic URI to access any ressource is
GET `/data/<Classname>/<instance db id>`
The `local:` uri prefix is meant to resolve to `<http://servername/data/>`.

The other endpoints follow the pattern
`/data/<classname>/<instance id>(/<collection name>/<instance id>)+`
So we speak of class, instance or collection context, depending where we are in the URL.

It is generally possible to PUT or DEL on any instance context, 
and to POST to any class or collection context.
POST will return a 201 with the link in the body in the Location response header.

The set of collections available from an instance type is mostly given by the SQLAlchemy relations (and properties),
but there is a magic URL to obtain the list:
`/data/<classname>/<instance id>(/<collection name>/<instance id>)*/@@collections`

Another special case is when the collection name is actually a singleton.
In that case, one is allowed to use `-` instead of a database ID which one may not know.

This module defines generic behaviour, but more specific views can be defined
through new view predicates: Look at `add_view_predicate` in `..traversal`, and there is an example in 
the widget collection view in `.widget`. 
Note that the view_config must have at least as many specifiers as the one it tries to override!

Permissions for the default views are specified by the crud_permissions class attribute, but more specific
views may have their own permissions system. 
For that reason, it will be generally useful to POST/PUT through collections accessed from the discussion, such as
`/data/Discussion/<number>(/<collection name>/<instance id>)+`
as opposed to the bare URLs `/data/<Classname>/<instance db id>` which are provided after a POST.
Traversing the discussion allows the user permissions specific to the discussion to be applied to the next operation.
The structure of those collection URLs will have to be reconstructed (from the POSTed collection, add the ID from the bare URL.)
"""

import os
import datetime
import inspect as pyinspect

from sqlalchemy import inspect
from pyramid.view import view_config
from pyramid.httpexceptions import (
    HTTPBadRequest, HTTPNotImplemented, HTTPUnauthorized, HTTPOk, HTTPNotFound)
from pyramid.security import authenticated_userid
from pyramid.response import Response
from pyramid.settings import asbool
from pyld import jsonld
from simplejson import dumps

from ..traversal import (
    InstanceContext, CollectionContext, ClassContext, Api2Context)
from assembl.auth import (
    P_READ, P_SYSADMIN, P_ADMIN_DISC, R_SYSADMIN, P_ADD_POST,
    IF_OWNED, Everyone, CrudPermissions)
from assembl.auth.util import get_roles, get_permissions
from assembl.semantic.virtuoso_mapping import get_virtuoso
from assembl.models import (
    AbstractIdeaVote, User, DiscussionBoundBase, Discussion)
from assembl.lib.decl_enums import DeclEnumType

FIXTURE_DIR = os.path.join(
    os.path.dirname(__file__), '..', '..', 'static', 'js', 'tests', 'fixtures')
API_PREFIX = '/data/'

FORM_HEADER = "Content-Type:(application/x-www-form-urlencoded)|(multipart/form-data)"
JSON_HEADER = "Content-Type:application/(.*\+)?json"


def includeme(config):
    """ Initialize views and renderers at app start-up time. """
    config.add_route('csrf_token2', 'Token')


def check_permissions(
        ctx, user_id, permissions, operation):
    cls = ctx.get_target_class()
    allowed = cls.user_can_cls(user_id, operation, permissions)
    if not allowed or (allowed == IF_OWNED and user_id == Everyone):
        raise HTTPUnauthorized()
    return allowed


@view_config(context=ClassContext, renderer='json',
             request_method='GET', permission=P_READ)
def class_view(request):
    ctx = request.context
    user_id = authenticated_userid(request)
    permissions = get_permissions(
        user_id, ctx.get_discussion_id())
    check = check_permissions(ctx, user_id, permissions, CrudPermissions.READ)
    view = request.GET.get('view', None) or ctx.get_default_view() or 'id_only'
    tombstones = asbool(request.GET.get('tombstones', False))
    q = ctx.create_query(view == 'id_only', tombstones)
    if check == IF_OWNED:
        if not user_id:
            raise HTTPUnauthorized()
        q = ctx.get_target_class().restrict_to_owners(q, user_id)
    if view == 'id_only':
        return [ctx._class.uri_generic(x) for (x,) in q.all()]
    else:
        r = [i.generic_json(view, user_id, permissions) for i in q.all()]
        return [x for x in r if x is not None]


@view_config(context=InstanceContext, renderer='json', name="jsonld",
             request_method='GET', permission=P_READ,
             accept="application/ld+json")
@view_config(context=InstanceContext, renderer='json',
             request_method='GET', permission=P_READ,
             accept="application/ld+json")
def instance_view_jsonld(request):
    from assembl.semantic.virtuoso_mapping import AssemblQuadStorageManager
    from rdflib import URIRef, ConjunctiveGraph
    ctx = request.context
    user_id = authenticated_userid(request)
    permissions = get_permissions(
        user_id, ctx.get_discussion_id())
    instance = ctx._instance
    if not instance.user_can(user_id, CrudPermissions.READ, permissions):
        return HTTPUnauthorized()
    discussion = ctx.get_instance_of_class(Discussion)
    if not discussion:
        raise HTTPNotFound()
    aqsm = AssemblQuadStorageManager()
    uri = URIRef(aqsm.local_uri() + instance.uri()[6:])
    d_storage_name = aqsm.discussion_storage_name(discussion.id)
    v = get_virtuoso(instance.db, d_storage_name)
    cg = ConjunctiveGraph(v, d_storage_name)
    result = cg.triples((uri, None, None))
    #result = v.query('select ?p ?o ?g where {graph ?g {<%s> ?p ?o}}' % uri)
    # Something is wrong here.
    triples = '\n'.join([
        '%s %s %s.' % (uri.n3(), p.n3(), o.n3())
        for (s, p, o) in result
        if '_with_no_name_entry' not in o])
    return aqsm.quads_to_jsonld(triples)


@view_config(context=InstanceContext, renderer='json',
             request_method='GET', accept="application/json")
def instance_view(request):
    ctx = request.context
    user_id = authenticated_userid(request)
    permissions = get_permissions(
        user_id, ctx.get_discussion_id())
    instance = ctx._instance
    if not instance.user_can(user_id, CrudPermissions.READ, permissions):
        return HTTPUnauthorized()
    view = ctx.get_default_view() or 'default'
    view = request.GET.get('view', view)
    return instance.generic_json(view, user_id, permissions)


@view_config(context=CollectionContext, renderer='json',
             request_method='GET')
def collection_view(request, default_view='default'):
    ctx = request.context
    user_id = authenticated_userid(request)
    permissions = get_permissions(
        user_id, ctx.get_discussion_id())
    check = check_permissions(ctx, user_id, permissions, CrudPermissions.READ)
    view = request.GET.get('view', None) or ctx.get_default_view() or default_view
    tombstones = asbool(request.GET.get('tombstones', False))
    q = ctx.create_query(view == 'id_only', tombstones)
    if check == IF_OWNED:
        if not user_id:
            raise HTTPUnauthorized()
        q = ctx.get_target_class().restrict_to_owners(q, user_id)
    if view == 'id_only':
        return [ctx.collection_class.uri_generic(x) for (x,) in q.all()]
    else:
        res = [i.generic_json(view, user_id, permissions) for i in q.all()]
        return [x for x in res if x is not None]


def collection_add(request, args):
    ctx = request.context
    user_id = authenticated_userid(request)
    permissions = get_permissions(
        user_id, ctx.get_discussion_id())
    check_permissions(ctx, user_id, permissions, CrudPermissions.CREATE)
    if 'type' in args:
        args = dict(args)
        typename = args['type']
        del args['type']
    else:
        typename = ctx.collection_class.external_typename()
    session = User.default_db
    old_autoflush = session.autoflush
    session.autoflush = False
    try:
        instances = ctx.create_object(typename, None, user_id, **args)
    except Exception as e:
        session.autoflush = old_autoflush
        raise HTTPBadRequest(e)
    if instances:
        first = instances[0]
        db = first.db
        for instance in instances:
            db.add(instance)
        session.autoflush = old_autoflush
        session.flush()
        return Response(
            dumps(first.generic_json('default', user_id, permissions)),
            location=first.uri_generic(first.id),
            status_code=201)
    raise HTTPBadRequest()


@view_config(context=CollectionContext, request_method='POST',
             header=FORM_HEADER)
def collection_add_with_params(request):
    return collection_add(request, request.params)


@view_config(context=InstanceContext, request_method='POST')
def instance_post(request):
    raise HTTPBadRequest()


@view_config(context=InstanceContext, request_method='PUT', header=JSON_HEADER,
             renderer='json')
def instance_put_json(request):
    ctx = request.context
    user_id = authenticated_userid(request)
    permissions = get_permissions(
        user_id, ctx.get_discussion_id())
    instance = ctx._instance
    if not instance.user_can(user_id, CrudPermissions.UPDATE, permissions):
        return HTTPUnauthorized()
    try:
        updated = instance.update_from_json(request.json_body, user_id, ctx)
        view = request.GET.get('view', None) or 'default'
        if view == 'id_only':
            return [updated.uri()]
        else:
            return updated.generic_json(view, user_id, permissions)

    except NotImplemented:
        raise HTTPNotImplemented()


@view_config(context=InstanceContext, request_method='PUT', header=FORM_HEADER,
             renderer='json')
def instance_put(request):
    ctx = request.context
    user_id = authenticated_userid(request)
    permissions = get_permissions(user_id, ctx.get_discussion_id())
    instance = ctx._instance
    if not instance.user_can(user_id, CrudPermissions.UPDATE, permissions):
        return HTTPUnauthorized()
    mapper = inspect(instance.__class__)
    cols = {c.key: c for c in mapper.columns if not c.foreign_keys}
    setables = dict(pyinspect.getmembers(
        instance.__class__, lambda p:
        pyinspect.isdatadescriptor(p) and getattr(p, 'fset', None)))
    relns = {r.key: r for r in mapper.relationships if not r.uselist and
             len(r._calculated_foreign_keys) == 1 and iter(
                 r._calculated_foreign_keys).next().table == mapper.local_table
             }
    unknown = set(request.params.keys()) - (
        set(cols.keys()).union(set(setables.keys())).union(set(relns.keys())))
    if unknown:
        raise HTTPBadRequest("Unknown keys: "+",".join(unknown))
    params = dict(request.params)
    # type checking
    columns = {c.key: c for c in mapper.columns}
    for key, value in params.items():
        if key in relns and isinstance(value, (str, unicode)):
            val_inst = relns[key].class_.get_instance(value)
            if not val_inst:
                raise HTTPBadRequest("Unknown instance: "+value)
            params[key] = val_inst
        elif key in columns and isinstance(columns[key].type, DeclEnumType) \
                and isinstance(value, (str, unicode)):
            val_det = columns[key].type.enum.from_string(value)
            if not val_det:
                raise HTTPBadRequest("Cannot interpret " + value)
            params[key] = val_det
        elif key in columns and columns[key].type.python_type == datetime.datetime \
                and isinstance(value, (str, unicode)):
            val_dt = datetime.datetime.strpstr(value)
            if not val_dt:
                raise HTTPBadRequest("Cannot interpret " + value)
            params[key] = val_dt
        elif key in columns and columns[key].type.python_type == int \
                and isinstance(value, (str, unicode)):
            try:
                params[key] = int(value)
            except ValueError as err:
                raise HTTPBadRequest("Not a number: " + value)
        elif key in columns and not isinstance(value, columns[key].type.python_type):
            raise HTTPBadRequest("Value %s for key %s should be a %s" % (
                value, key, columns[key].type.python_type))
    try:
        for key, value in params.items():
            setattr(instance, key, value)
    except:
        raise HTTPBadRequest()
    view = request.GET.get('view', None) or 'default'
    if view == 'id_only':
        return [instance.uri()]
    else:
        user_id = authenticated_userid(request)
        return instance.generic_json(view, user_id, permissions)


@view_config(context=InstanceContext, request_method='DELETE', renderer='json')
def instance_del(request):
    ctx = request.context
    user_id = authenticated_userid(request)
    permissions = get_permissions(
        user_id, ctx.get_discussion_id())
    instance = ctx._instance
    if not instance.user_can(user_id, CrudPermissions.DELETE, permissions):
        return HTTPUnauthorized()
    instance.db.delete(instance)
    return {}


@view_config(name="collections", context=InstanceContext, renderer='json',
             request_method="GET", permission=P_READ)
def show_collections(request):
    return request.context.get_collection_names()


@view_config(name="classes", context=Api2Context, renderer='json',
             request_method="GET", permission=P_READ)
def show_class_names(request):
    return request.context.all_class_names()


@view_config(context=ClassContext, request_method='POST', header=FORM_HEADER)
def class_add(request):
    ctx = request.context
    user_id = authenticated_userid(request)
    permissions = get_permissions(
        user_id, ctx.get_discussion_id())
    check_permissions(ctx, user_id, permissions, CrudPermissions.CREATE)
    args = request.params
    typename = args.get('type', None)
    if typename:
        cls = ctx.get_class(typename)
    else:
        cls = request.context._class
        typename = cls.external_typename()
    try:
        instances = ctx.create_object(typename, None, user_id, **args)
    except Exception as e:
        raise HTTPBadRequest(e)
    if instances:
        first = instances[0]
        db = first.db
        for instance in instances:
            db.add(instance)
        db.flush()
        return Response(
            dumps(first.generic_json('default', user_id, permissions)),
            location=first.uri_generic(first.id),
            status_code=201)
    raise HTTPBadRequest()


@view_config(context=CollectionContext, request_method='POST',
             header=JSON_HEADER)
def collection_add_json(request):
    ctx = request.context
    user_id = authenticated_userid(request)
    permissions = get_permissions(
        user_id, ctx.get_discussion_id())
    check_permissions(ctx, user_id, permissions, CrudPermissions.CREATE)
    typename = ctx.collection_class.external_typename()
    typename = request.json_body.get(
        '@type', ctx.collection_class.external_typename())
    try:
        instances = ctx.create_object(typename, request.json_body, user_id)
    except Exception as e:
        raise HTTPBadRequest(e)
    if instances:
        first = instances[0]
        db = first.db
        for instance in instances:
            db.add(instance)
        db.flush()
        view = request.GET.get('view', None) or 'default'
        return Response(
            dumps(first.generic_json(view, user_id, permissions)),
            location=first.uri_generic(first.id),
            status_code=201)


# Votes are private
# @view_config(context=CollectionContext, renderer='json',
#              request_method='GET', permission=P_READ,
#              ctx_collection_class=AbstractIdeaVote)
# def votes_collection_view(request):
#     ctx = request.context
#     user_id = authenticated_userid(request)
#     if user_id == Everyone:
#         raise HTTPUnauthorized
#     view = request.GET.get('view', None) or ctx.get_default_view() or 'id_only'
#     tombstones = asbool(request.GET.get('tombstones', False))
#     q = ctx.create_query(view == 'id_only', tombstones).join(
#         User).filter(User.id==user_id)
#     if view == 'id_only':
#         return [ctx.collection_class.uri_generic(x) for (x,) in q.all()]
#     else:
#         return [i.generic_json(view) for i in q.all()]


@view_config(context=CollectionContext, request_method='POST',
             header=JSON_HEADER,  # permission=P_ADD_VOTE?,
             ctx_collection_class=AbstractIdeaVote)
def votes_collection_add_json(request):
    ctx = request.context
    user_id = authenticated_userid(request)
    permissions = get_permissions(
        user_id, ctx.get_discussion_id())
    check_permissions(ctx, user_id, permissions, CrudPermissions.CREATE)
    typename = ctx.collection_class.external_typename()
    typename = request.json_body.get(
        '@type', ctx.collection_class.external_typename())
    json = request.json_body
    json['voter'] = User.uri_generic(user_id)
    try:
        instances = ctx.create_object(typename, json, user_id)
    except Exception as e:
        raise HTTPBadRequest(e)
    if instances:
        first = instances[0]
        db = first.db
        for instance in instances:
            db.add(instance)
        db.flush()
        view = request.GET.get('view', None) or 'default'
        return Response(
            dumps(first.generic_json(view, user_id, permissions)),
            location=first.uri_generic(first.id),
            status_code=201)


@view_config(context=CollectionContext, request_method='POST',
             header=FORM_HEADER, ctx_collection_class=AbstractIdeaVote)
def votes_collection_add(request):
    ctx = request.context
    user_id = authenticated_userid(request)
    permissions = get_permissions(
        user_id, ctx.get_discussion_id())
    check_permissions(ctx, user_id, permissions, CrudPermissions.CREATE)
    args = request.params
    if 'type' in args:
        args = dict(args)
        typename = args['type']
        del args['type']
    else:
        typename = ctx.collection_class.external_typename()
    args['voter_id'] = user_id
    try:
        instances = ctx.create_object(typename, None, user_id, **args)
    except Exception as e:
        raise HTTPBadRequest(e)
    if instances:
        first = instances[0]
        db = first.db
        for instance in instances:
            db.add(instance)
        print "before flush"
        db.flush()
        print "after flush"
        return Response(
            dumps(first.generic_json('default', user_id, permissions)),
            location=first.uri_generic(first.id),
            status_code=201)
    raise HTTPBadRequest()
