from functools import partial

from pyramid.response import Response
from pyramid.view import view_config
from pyramid.httpexceptions import (HTTPOk, HTTPBadRequest, HTTPUnauthorized)
from pyramid_dogpile_cache import get_region
from pyramid.security import authenticated_userid

from assembl.auth import (P_READ, P_ADMIN_DISC, Everyone)
from assembl.auth.password import verify_data_token
from assembl.auth.util import get_permissions
from assembl.models import (Discussion)
from ..traversal import InstanceContext
from . import JSON_HEADER


@view_config(context=InstanceContext, request_method='GET',
             ctx_instance_class=Discussion, permission=P_READ,
             accept="application/json", name="settings",
             renderer='json')
def discussion_settings_get(request):
    return request.context._instance.settings_json


@view_config(context=InstanceContext, request_method='PUT',
             ctx_instance_class=Discussion, permission=P_ADMIN_DISC,
             header=JSON_HEADER, name="settings")
def discussion_settings_put(request):
    request.context._instance.settings_json = request.json_body
    return HTTPOk()


discussion_jsonld_cache = get_region('discussion_jsonld')
userprivate_jsonld_cache = get_region('userprivate_jsonld')

@discussion_jsonld_cache.cache_on_arguments()
def discussion_jsonld(discussion_id):
    from assembl.semantic.virtuoso_mapping import AssemblQuadStorageManager
    aqsm = AssemblQuadStorageManager()
    return aqsm.as_jsonld(discussion_id)


@userprivate_jsonld_cache.cache_on_arguments()
def userprivate_jsonld(discussion_id):
    from assembl.semantic.virtuoso_mapping import AssemblQuadStorageManager
    aqsm = AssemblQuadStorageManager()
    cg = aqsm.participants_private_as_graph(discussion_id)
    return aqsm.graph_as_jsonld(cg)



def read_user_token(request):
    salt = None
    user_id = authenticated_userid(request)
    if 'token' in request.GET:
        token = request.GET['token'].encode('ascii')
        data = verify_data_token(token)
        if data is None:
            raise HTTPBadRequest("Invalid token")
        token_user_id, salt = data.split('d', 1)
        try:
            token_user_id = int(token_user_id)
        except ValueError:
            raise HTTPBadRequest("Invalid token")
        if user_id == Everyone:
            user_id = token_user_id
        elif user_id != token_user_id:
            raise HTTPBadRequest("Stolen token")
    return user_id, salt

@view_config(context=InstanceContext, name="jsonld",
             ctx_instance_class=Discussion, request_method='GET',
             accept="application/ld+json")
@view_config(context=InstanceContext,
             ctx_instance_class=Discussion, request_method='GET',
             accept="application/ld+json")
def discussion_instance_view_jsonld(request):
    discussion = request.context._instance
    user_id, salt = read_user_token(request)
    permissions = get_permissions(user_id, discussion.id)
    if P_READ not in permissions:
        raise HTTPUnauthorized()
    if not salt and P_ADMIN_DISC not in permissions:
        from os import urandom
        from base64 import urlsafe_b64encode
        salt = urlsafe_b64encode(urandom(6))

    json = discussion_jsonld(discussion.id)
    if salt:
        from assembl.semantic.virtuoso_mapping import (
            AssemblQuadStorageManager, hash_obfuscator)
        obfuscator = partial(hash_obfuscator, salt=salt)
        json = AssemblQuadStorageManager.obfuscate(json, obfuscator)
    # TODO: Add age
    return Response(body=json, content_type="application/ld+json")


@view_config(context=InstanceContext, name="private_jsonld",
             ctx_instance_class=Discussion, request_method='GET',
             accept="application/ld+json")
def user_private_view_jsonld(request):
    discussion = request.context._instance
    user_id, salt = read_user_token(request)
    permissions = get_permissions(user_id, discussion.id)
    # TODO: Create a view_user_private permission
    if P_ADMIN_DISC not in permissions:
        raise HTTPUnauthorized()

    json = userprivate_jsonld(discussion.id)
    if salt:
        from assembl.semantic.virtuoso_mapping import (
            AssemblQuadStorageManager, hash_obfuscator)
        obfuscator = partial(hash_obfuscator, salt=salt)
        json = AssemblQuadStorageManager.obfuscate(json, obfuscator)
    # TODO: Add age
    return Response(body=json, content_type="application/ld+json")
