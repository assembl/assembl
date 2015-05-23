from simplejson import dumps
from string import Template

from pyramid.response import Response
from pyramid.view import view_config
from pyramid.security import authenticated_userid, Everyone
from pyramid.httpexceptions import (
    HTTPNotFound, HTTPUnauthorized, HTTPBadRequest, HTTPClientError,
    HTTPOk, HTTPNoContent, HTTPForbidden)

from assembl.auth import (
    P_ADMIN_DISC, P_SELF_REGISTER, P_SELF_REGISTER_REQUEST,
    R_PARTICIPANT, CrudPermissions)
from assembl.models import (
    User, Discussion, LocalUserRole, AbstractAgentAccount)
from assembl.auth.util import get_permissions
from ..traversal import (CollectionContext, InstanceContext)
from .. import JSONError
from . import (
    FORM_HEADER, JSON_HEADER, collection_view, instance_put_json,
    collection_add_json)


@view_config(
    context=CollectionContext, request_method="POST",
    ctx_named_collection="Discussion.local_user_roles",
    header=JSON_HEADER, renderer='json')
@view_config(
    context=CollectionContext, request_method="POST",
    ctx_named_collection="User.local_roles",
    header=JSON_HEADER, renderer='json')
def add_local_role(request):
    # Do not use check_permissions, this is a special case
    ctx = request.context
    user_id = authenticated_userid(request)
    if user_id == Everyone:
        raise HTTPUnauthorized()
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
        instances = ctx.create_object("LocalUserRole", json, user_id)
    except HTTPClientError as e:
        raise e
    except Exception as e:
        raise HTTPBadRequest(e)
    if instances:
        first = instances[0]
        db = first.db
        for instance in instances:
            db.add(instance)
        db.flush()
        # Side effect: materialize subscriptions.
        if not first.requested:
            # relationship may not be initialized
            user = first.user or User.get(first.user_id)
            user.get_notification_subscriptions(discussion_id, True)
        view = request.GET.get('view', None) or 'default'
        permissions = get_permissions(
            user_id, ctx.get_discussion_id())
        return Response(
            dumps(first.generic_json(view, user_id, permissions)),
            location=first.uri_generic(first.id),
            status_code=201)


@view_config(
    context=InstanceContext, request_method="PUT",
    ctx_named_collection_instance="Discussion.local_user_roles",
    header=JSON_HEADER, renderer='json')
@view_config(
    context=InstanceContext, request_method="PUT",
    ctx_named_collection_instance="User.local_roles",
    header=JSON_HEADER, renderer='json')
def set_local_role(request):
    # Do not use check_permissions, this is a special case
    ctx = request.context
    instance = ctx._instance
    user_id = authenticated_userid(request)
    if user_id == Everyone:
        raise HTTPUnauthorized()
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
    updated = instance.update_from_json(json, user_id, ctx)
    view = request.GET.get('view', None) or 'default'
    if view == 'id_only':
        return [updated.uri()]
    else:
        return updated.generic_json(view, user_id, permissions)


@view_config(
    context=CollectionContext, request_method="POST",
    ctx_named_collection="Discussion.local_user_roles",
    header=FORM_HEADER)
@view_config(
    context=CollectionContext, request_method="POST",
    ctx_named_collection="User.local_roles",
    header=FORM_HEADER)
def use_json_header_for_LocalUserRole_POST(request):
    raise HTTPNotFound()


@view_config(
    context=CollectionContext, request_method="PUT",
    ctx_named_collection="Discussion.local_user_roles",
    header=FORM_HEADER)
@view_config(
    context=CollectionContext, request_method="PUT",
    ctx_named_collection="User.local_roles",
    header=FORM_HEADER)
def use_json_header_for_LocalUserRole_PUT(request):
    raise HTTPNotFound()


@view_config(context=CollectionContext, renderer='json', request_method='GET',
             ctx_collection_class=LocalUserRole,
             accept="application/json")
def view_localuserrole_collection(request):
    return collection_view(request, 'default')


@view_config(
    context=InstanceContext, ctx_instance_class=AbstractAgentAccount,
    request_method='POST', name="verify", renderer='json')
def send_account_verification(request):
    ctx = request.context
    instance = ctx._instance
    if instance.verified:
        return HTTPNoContent(
            "No need to verify email <%s>" % (instance.email))
    from assembl.views.auth.views import send_confirmation_email
    request.matchdict = {}
    send_confirmation_email(request, instance)
    return {}


# Should I add a secure_connection condition?
@view_config(
    context=InstanceContext, ctx_instance_class=User,
    request_method='GET', name="verify_password", renderer='json')
def verify_password(request):
    ctx = request.context
    user = ctx._instance
    password = request.params.get('password', None)
    if password is not None:
        return user.check_password(password)
    raise HTTPBadRequest("Please provide a password")


@view_config(
    context=InstanceContext, ctx_instance_class=AbstractAgentAccount,
    request_method='DELETE', renderer='json')
def delete_abstract_agent_account(request):
    ctx = request.context
    user_id = authenticated_userid(request)
    permissions = get_permissions(
        user_id, ctx.get_discussion_id())
    instance = ctx._instance
    if not instance.user_can(user_id, CrudPermissions.DELETE, permissions):
        return HTTPUnauthorized()
    if instance.email:
        accounts_with_mail = [a for a in instance.profile.accounts if a.email]
        if len(accounts_with_mail) == 1:
            raise JSONError(403, "This is the last account")
        if instance.verified:
            verified_accounts_with_mail = [
                a for a in accounts_with_mail if a.verified]
            if len(verified_accounts_with_mail) == 1:
                raise JSONError(403, "This is the last verified account")
    instance.db.delete(instance)
    return {}


@view_config(context=InstanceContext, request_method='PUT', header=JSON_HEADER,
             ctx_instance_class=AbstractAgentAccount, renderer='json')
def put_abstract_agent_account(request):
    instance = request.context._instance
    old_preferred = instance.preferred
    new_preferred = request.json_body.get('preferred', False)
    if new_preferred and not instance.email:
        raise HTTPForbidden("Cannot prefer an account without email")
    if new_preferred and not instance.verified:
        raise HTTPForbidden("Cannot set a non-verified email as preferred")
    result = instance_put_json(request)
    assert instance.preferred == new_preferred
    if new_preferred and not old_preferred:
        for account in instance.profile.accounts:
            if account != instance:
                account.preferred = False
    return result


@view_config(context=CollectionContext, request_method='POST',
             header=JSON_HEADER, ctx_collection_class=AbstractAgentAccount)
def post_email_account(request):
    from assembl.views.auth.views import send_confirmation_email
    response = collection_add_json(request)
    request.matchdict = {}
    instance = request.context.collection_class.get_instance(response.location)
    send_confirmation_email(request, instance)
    return response
