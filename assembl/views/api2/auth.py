from simplejson import dumps

from pyramid.response import Response
from pyramid.view import view_config
from pyramid.security import authenticated_userid
from pyramid.httpexceptions import (
    HTTPNotFound, HTTPUnauthorized, HTTPBadRequest, HTTPClientError)

from assembl.auth import (
    P_ADMIN_DISC, P_SELF_REGISTER, P_SELF_REGISTER_REQUEST, R_PARTICIPANT)
from assembl.models import (User, Discussion, LocalUserRole)
from assembl.auth.util import get_permissions
from ..traversal import (CollectionContext, InstanceContext)
from . import FORM_HEADER, JSON_HEADER, instance_put, collection_add


@view_config(
    context=CollectionContext, request_method="POST",
    ctx_named_collection="Discussion.local_user_roles",
    header=JSON_HEADER, renderer='json')
def add_local_role(request):
    ctx = request.context
    user_id = authenticated_userid(request)
    discussion_id = ctx.get_discussion_id()
    user_uri = User.uri_generic(user_id)
    if discussion_id is None:
        raise HTTPBadRequest()
    permissions = get_permissions(user_id, discussion_id)
    json = request.json_body
    if "discussion" not in json:
        json["discussion"] = Discussion.uri_generic(discussion_id)
    requested_user = json.get('user', None)
    if not requested_user:
        json['user'] = requested_user = user_uri
    elif requested_user != user_uri and P_ADMIN_DISC not in permissions:
        raise HTTPUnauthorized()
    if P_ADMIN_DISC not in permissions:
        if P_SELF_REGISTER in permissions:
            json['requested'] = False
            json['role'] = R_PARTICIPANT
        elif P_SELF_REGISTER_REQUEST in permissions:
            json['requested'] = True
        else:
            raise HTTPUnauthorized()
    try:
        instances = ctx.create_object("DiscussionLocalRole", json, user_id)
    except HTTPClientError as e:
        raise e
    except Exception as e:
        raise HTTPBadRequest(e)
    if instances:
        first = instances[0]
        db = first.db()
        for instance in instances:
            db.add(instance)
        db.flush()
        return Response(
            dumps(first.generic_json()),
            location=first.uri_generic(first.id),
            status_code=201)


@view_config(
    context=InstanceContext, request_method="PUT",
    ctx_named_collection_instance="Discussion.local_user_roles",
    header=JSON_HEADER, renderer='json')
def set_local_role(request):
    ctx = request.context
    instance = ctx._instance
    user_id = authenticated_userid(request)
    discussion_id = ctx.get_discussion_id()
    user_uri = User.uri_generic(user_id)
    if discussion_id is None:
        raise HTTPBadRequest()
    permissions = get_permissions(user_id, discussion_id)
    json = request.json_body
    requested_user = json.get('user', None)
    if not requested_user:
        json['user'] = requested_user = user_uri
    elif requested_user != user_uri and P_ADMIN_DISC not in permissions:
        raise HTTPUnauthorized()
    if P_ADMIN_DISC not in permissions:
        if P_SELF_REGISTER in permissions:
            json['requested'] = False
            json['role'] = R_PARTICIPANT
        elif P_SELF_REGISTER_REQUEST in permissions:
            json['requested'] = True
        else:
            raise HTTPUnauthorized()
    updated = instance.update_json(json, user_id)
    view = request.GET.get('view', None) or ctx.get_default_view() or 'id_only'
    if view == 'id_only':
        return [updated.uri()]
    else:
        return [updated.generic_json(view)]


@view_config(
    context=CollectionContext, request_method="POST",
    ctx_named_collection="Discussion.local_user_roles",
    header=FORM_HEADER)
def use_json_header_for_LocalUserRole_POST(request):
    raise HTTPNotFound()


@view_config(
    context=CollectionContext, request_method="PUT",
    ctx_named_collection="Discussion.local_user_roles",
    header=FORM_HEADER)
def use_json_header_for_LocalUserRole_PUT(request):
    raise HTTPNotFound()
