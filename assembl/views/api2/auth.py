from simplejson import dumps, loads
from string import Template
from datetime import datetime
from sqlalchemy import func

from pyramid.response import Response
from pyramid.view import view_config
from pyramid.settings import asbool
from pyramid.security import (
    Everyone, NO_PERMISSION_REQUIRED, remember, forget)
from pyramid.i18n import TranslationStringFactory
from pyramid.httpexceptions import (
    HTTPNotFound, HTTPUnauthorized, HTTPBadRequest, HTTPClientError,
    HTTPOk, HTTPNoContent, HTTPForbidden, HTTPNotImplemented,
    HTTPPreconditionFailed, HTTPConflict, HTTPInternalServerError)
from pyisemail import is_email

from graphql_relay.node.node import from_global_id
from assembl.lib.sqla_types import EmailString
from ...lib import config
from assembl.auth import (
    P_ADMIN_DISC, P_SELF_REGISTER, P_SELF_REGISTER_REQUEST,
    R_PARTICIPANT, P_READ, CrudPermissions)
from assembl.auth.social_auth import maybe_social_logout
from assembl.models import (
    User, Discussion, LocalUserRole, AbstractAgentAccount, AgentProfile,
    UserLanguagePreference, EmailAccount, AgentStatusInDiscussion, Username,
    AbstractConfigurableField, ProfileField)
from assembl.auth.password import (
    verify_password_change_token, get_data_token_time, Validity)
from assembl.auth.util import get_permissions, discussion_from_request
from ..traversal import (CollectionContext, InstanceContext, ClassContext)
from ..errors import ErrorTypes
from .. import JSONError
from . import (
    FORM_HEADER, JSON_HEADER, collection_view, instance_put_json,
    collection_add_json, instance_view, check_permissions, CreationResponse)
from assembl.lib.sqla import ObjectNotUniqueError
from ..auth.views import (
    send_change_password_email, from_identifier, send_confirmation_email,
    maybe_auto_subscribe)
from assembl.lib import logging


_ = TranslationStringFactory('assembl')
generic_error_message = _("The provided input combination is not valid.")

@view_config(
    context=ClassContext, request_method="PATCH",
    ctx_class=LocalUserRole)
@view_config(
    context=ClassContext, request_method="PUT",
    ctx_class=LocalUserRole)
@view_config(
    context=ClassContext, request_method="POST",
    ctx_class=LocalUserRole)
def add_local_role_on_class(request):
    # Did not securize this route, so forbid it.
    raise HTTPNotFound()


@view_config(
    context=CollectionContext, request_method="POST",
    ctx_named_collection="Discussion.local_user_roles",
    header=JSON_HEADER, renderer='json')
@view_config(
    context=CollectionContext, request_method="POST",
    ctx_named_collection="LocalRoleCollection.local_roles",
    header=JSON_HEADER, renderer='json')
def add_local_role(request):
    # Do not use check_permissions, this is a special case
    ctx = request.context
    user_id = request.authenticated_userid
    if not user_id:
        raise HTTPUnauthorized()
    discussion_id = ctx.get_discussion_id()
    discussion = Discussion.get(discussion_id)
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
            req_user = User.get_instance(requested_user)
            if not discussion.check_authorized_email(req_user):
                raise HTTPForbidden()
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

        # Update the user's AgentStatusInDiscussion
        user.update_agent_status_subscribe(discussion)

        view = request.GET.get('view', None) or 'default'
        permissions = get_permissions(
            user_id, ctx.get_discussion_id())
        return CreationResponse(first, user_id, permissions, view)


@view_config(
    context=InstanceContext, request_method="PATCH",
    ctx_named_collection_instance="Discussion.local_user_roles",
    header=JSON_HEADER, renderer='json')
@view_config(
    context=InstanceContext, request_method="PATCH",
    ctx_named_collection_instance="LocalRoleCollection.local_roles",
    header=JSON_HEADER, renderer='json')
@view_config(
    context=InstanceContext, request_method="PUT",
    ctx_named_collection_instance="Discussion.local_user_roles",
    header=JSON_HEADER, renderer='json')
@view_config(
    context=InstanceContext, request_method="PUT",
    ctx_named_collection_instance="LocalRoleCollection.local_roles",
    header=JSON_HEADER, renderer='json')
def set_local_role(request):
    # Do not use check_permissions, this is a special case
    ctx = request.context
    instance = ctx._instance
    user_id = request.authenticated_userid
    if not user_id:
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

    # Update the user's AgentStatusInDiscussion
    user = User.get(user_id)
    discussion = Discussion.get(discussion_id)
    user.update_agent_status_subscribe(discussion)

    if view == 'id_only':
        return [updated.uri()]
    else:
        return updated.generic_json(view, user_id, permissions)


@view_config(
    context=InstanceContext, request_method='DELETE',
    ctx_named_collection_instance="Discussion.local_user_roles",
    renderer='json')
@view_config(
    context=InstanceContext, request_method='DELETE',
    ctx_named_collection_instance="LocalRoleCollection.local_roles",
    renderer='json')
def delete_local_role(request):
    ctx = request.context
    instance = ctx._instance
    user_id = request.authenticated_userid
    if not user_id:
        raise HTTPUnauthorized()
    discussion_id = ctx.get_discussion_id()

    if discussion_id is None:
        raise HTTPBadRequest()
    permissions = get_permissions(user_id, discussion_id)
    requested_user = instance.user
    if requested_user.id != user_id and P_ADMIN_DISC not in permissions:
        raise HTTPUnauthorized()

    user = User.get(user_id)
    discussion = Discussion.get(discussion_id)
    instance.db.delete(instance)
    # Update the user's AgentStatusInDiscussion
    user.update_agent_status_unsubscribe(discussion)
    instance.db.flush()  # maybe unnecessary
    return {}


@view_config(
    context=CollectionContext, request_method="POST",
    ctx_named_collection="Discussion.local_user_roles",
    header=FORM_HEADER)
@view_config(
    context=CollectionContext, request_method="POST",
    ctx_named_collection="LocalRoleCollection.local_roles",
    header=FORM_HEADER)
def use_json_header_for_LocalUserRole_POST(request):
    raise HTTPNotFound()


@view_config(
    context=CollectionContext, request_method="PUT",
    ctx_named_collection="Discussion.local_user_roles",
    header=FORM_HEADER)
@view_config(
    context=CollectionContext, request_method="PUT",
    ctx_named_collection="LocalRoleCollection.local_roles",
    header=FORM_HEADER)
def use_json_header_for_LocalUserRole_PUT(request):
    raise HTTPNotFound()


@view_config(context=CollectionContext, renderer='json', request_method='GET',
             ctx_collection_class=LocalUserRole,
             accept="application/json")
def view_localuserrole_collection(request):
    return collection_view(request, 'default')


@view_config(context=CollectionContext, renderer='json', request_method='GET',
             ctx_collection_class=AgentProfile,
             accept="application/json")
def view_profile_collection(request):
    ctx = request.context
    view = request.GET.get('view', None) or ctx.get_default_view() or 'default'
    content = collection_view(request)
    if view != "id_only":
        discussion = ctx.get_instance_of_class(Discussion)
        if discussion:
            from assembl.models import Post, AgentProfile
            num_posts_per_user = \
                AgentProfile.count_posts_in_discussion_all_profiles(discussion)
            for x in content:
                id = AgentProfile.get_database_id(x['@id'])
                if id in num_posts_per_user:
                    x['post_count'] = num_posts_per_user[id]
    return content


@view_config(context=InstanceContext, renderer='json', request_method='GET',
             ctx_instance_class=AgentProfile,
             accept="application/json")
def view_agent_profile(request):
    profile = instance_view(request)
    ctx = request.context
    view = ctx.get_default_view() or 'default'
    view = request.GET.get('view', view)
    if view not in ("id_only", "extended"):
        discussion = ctx.get_instance_of_class(Discussion)
        if discussion:
            profile['post_count'] = ctx._instance.count_posts_in_discussion(
                discussion.id)
    return profile


@view_config(
    context=InstanceContext, ctx_instance_class=AbstractAgentAccount,
    request_method='POST', name="verify", renderer='json')
def send_account_verification(request):
    ctx = request.context
    instance = ctx._instance
    if instance.verified:
        return HTTPNoContent(
            "No need to verify email <%s>" % (instance.email))
    request.matchdict = {}
    send_confirmation_email(request, instance)
    return {}


# Should I add a secure_connection condition?
@view_config(
    context=InstanceContext, ctx_instance_class=User,
    request_method='POST', name="verify_password", renderer='json')
def verify_password(request):
    ctx = request.context
    user = ctx._instance
    password = request.params.get('password', None)
    if password is None:
        raise HTTPBadRequest("Please provide a password")
    result = user.check_password(password)
    if result:
        user.successful_login()
    return result


@view_config(
    context=CollectionContext, ctx_instance_class=User,
    request_method='POST', permission=NO_PERMISSION_REQUIRED,
    name="logout", renderer='json')
def logout(request):
    logout_url = maybe_social_logout(request)
    forget(request)
    # Interesting question: Should I add a parameter
    # to log out of the social service?


@view_config(
    context=CollectionContext, ctx_collection_class=AgentProfile,
    request_method='POST', permission=NO_PERMISSION_REQUIRED,
    name="password_reset", header=JSON_HEADER)
@view_config(
    context=ClassContext, ctx_class=AgentProfile, header=JSON_HEADER,
    request_method='POST', permission=NO_PERMISSION_REQUIRED,
    name="password_reset")
def reset_password(request):
    identifier = request.json_body.get('identifier')
    user_id = request.json_body.get('user_id')
    slug = request.json_body.get('discussion_slug')
    logger = logging.getLogger('assembl.auth')
    discussion = None
    if slug:
        discussion = Discussion.default_db.query(
            Discussion).filter_by(slug=slug).first()
    email = None
    user = None
    localizer = request.localizer

    if user_id:
        user = AgentProfile.get(int(user_id))
        if not user:
            if not discussion.preferences['generic_auth_errors']:
                raise JSONError(
                    localizer.translate(_("The user does not exist")),
                    code=HTTPNotFound.code)
            else:
                raise JSONError(
                    localizer.translate(generic_error_message),
                    code=HTTPNotFound.code)
                logger.error("[Password reset] The user with the identifier %s does not exist" % (identifier))
        if identifier:
            for account in user.accounts:
                if identifier == account.email:
                    email = identifier
                    break
    elif identifier:
        user, account = from_identifier(identifier)
        if not user:
            if not discussion.preferences['generic_auth_errors']:
                raise JSONError(
                    localizer.translate(_("This email does not exist")),
                    code=HTTPNotFound.code)
            else:
                raise JSONError(
                    localizer.translate(_(generic_error_message)),
                    code=HTTPNotFound.code)
                logger.error("This email does not exist.")
        if account:
            email = account.email
    else:
        error = localizer.translate(_("Please give an identifier"))
        raise JSONError(error)
    if not email:
        email = user.get_preferred_email()
        if not email:
            if not discussion.preferences['generic_auth_errors']:
                error = localizer.translate(_("This user has no email"))
            else:
                error = localizer.translate(_(generic_error_message))
                logger.error("This user has no email.")
            raise JSONError(error, code=HTTPPreconditionFailed.code)
    if not isinstance(user, User):
        if not discussion.preferences['generic_auth_errors']:
            error = localizer.translate(_("This is not a user"))
        else:
            error = localizer.translate(_(generic_error_message))
            logger.error("This is not a user.")
        raise JSONError(error, code=HTTPPreconditionFailed.code)
    send_change_password_email(request, user, email, discussion=discussion)
    return HTTPOk()


@view_config(
    context=CollectionContext, ctx_collection_class=AgentProfile,
    request_method='POST', permission=NO_PERMISSION_REQUIRED,
    name="do_password_change", header=JSON_HEADER)
@view_config(
    context=ClassContext, ctx_class=AgentProfile, header=JSON_HEADER,
    request_method='POST', permission=NO_PERMISSION_REQUIRED,
    name="do_password_change")
def do_password_change(request):
    token = request.json_body.get('token') or ''
    password1 = request.json_body.get('password1', '').strip()
    password2 = request.json_body.get('password2', '').strip()
    localizer = request.localizer
    if password1 is '' or password2 is '' or password2 != password1:
        error = localizer.translate(
            _("The passwords that were entered are mismatched!"))
        raise JSONError(error, ErrorTypes.PASSWORD)

    # TODO: Check password quality!
    user, validity = verify_password_change_token(token)
    token_date = get_data_token_time(token)
    old_token = (
        user is None or token_date is None or (
            user.last_login and token_date < user.last_login))

    if (validity != Validity.VALID or old_token):
        # V-, V+P+W-B-L-: Invalid or obsolete token (obsolete+logged in treated later.)
        # Offer to send a new token
        if validity != Validity.VALID:
            error = localizer.translate(_(
                "This link is not valid. Do you want us to send another?"))
        else:
            error = localizer.translate(_(
                "This link has been used. Do you want us to send another?"))
        raise JSONError(error, validity)
    user.password_p = password1
    user.successful_login()
    headers = remember(request, user.id)
    request.response.headerlist.extend(headers)
    return HTTPOk()


@view_config(
    context=CollectionContext, ctx_collection_class=AgentProfile,
    request_method='POST', header=JSON_HEADER,
    permission=NO_PERMISSION_REQUIRED)
@view_config(
    context=ClassContext, ctx_class=User, header=JSON_HEADER,
    request_method='POST', permission=NO_PERMISSION_REQUIRED)
def assembl_register_user(request):
    forget(request)
    localizer = request.localizer
    session = AgentProfile.default_db
    json = request.json
    logger = logging.getLogger('assembl')
    discussion = discussion_from_request(request)
    permissions = get_permissions(
        Everyone, discussion.id if discussion else None)

    name = json.get('real_name', '').strip()
    errors = JSONError()
    if not name or len(name) < 3:
        errors.add_error(localizer.translate(_(
            "Please use a name of at least 3 characters")),
            ErrorTypes.SHORT_NAME)
    password = json.get('password', '').strip()
    # TODO: Check password strength. maybe pwdmeter?
    email = None
    for account in json.get('accounts', ()):
        email = account.get('email', None)
        if not is_email(email):
            errors.add_error(localizer.translate(_(
                "This is not a valid email")),
                ErrorTypes.INVALID_EMAIL)
            continue
        email = EmailString.normalize_email_case(email)
        # Find agent account to avoid duplicates!
        if session.query(AbstractAgentAccount).filter_by(
                email_ci=email).count():
            if not discussion.preferences['generic_auth_errors']:
                errors.add_error(localizer.translate(_(
                    "We already have a user with this email.")),
                    ErrorTypes.EXISTING_EMAIL,
                    HTTPConflict.code)
            else:
                errors.add_error(localizer.translate(
                    generic_error_message),
                    ErrorTypes.GENERIC,
                    HTTPConflict.code)
                logger.error("[User creation]: We already have a user with this email %s" % email)

    if not email:
        errors.add_error(localizer.translate(_("No email.")),
                         ErrorTypes.INVALID_EMAIL)
    username = json.get('username', None)
    if username:
        if session.query(Username).filter(
                func.lower(Username.username) == username.lower()).count():
            if not discussion.preferences['generic_auth_errors']:
                errors.add_error(localizer.translate(_(
                    "We already have a user with this username.")),
                    ErrorTypes.EXISTING_USERNAME,
                    HTTPConflict.code)
            else:
                errors.add_error(localizer.translate(
                    generic_error_message),
                    ErrorTypes.GENERIC,
                    HTTPConflict.code)
                logger.error("We already have a user with this username" % username)
        if len(username) > 20:
            errors.add_error(localizer.translate(_(
                "The username must be less than 20 characters.")),
                ErrorTypes.USERNAME_TOO_LONG,
                HTTPBadRequest.code)
    if discussion:
        check_subscription = discussion.preferences['whitelist_on_register']
        whitelist = discussion.preferences['require_email_domain']
        if check_subscription and whitelist:
            status = discussion.check_email(email)
            if not status:
                admin_emails = discussion.get_admin_emails()
                num = len(admin_emails)
                errors.add_error(
                    localizer.pluralize(
                        _("Your email domain has not been approved for registration. Please contact ${emails} for support."),
                        _("Your email domain has not been approved for registration. Please contact one of ${emails} for support."),
                        num,
                        mapping={'emails': ", ".join(admin_emails)}
                    )
                )
    if errors:
        raise errors

    # This logic needs to be above the JSONError checks to ensure that whitelisting is applied
    # even if the discussion does not have a P_SELF_REGISTER on system.Everyone
    if discussion and not (
            P_SELF_REGISTER in permissions or
            P_SELF_REGISTER_REQUEST in permissions):
        # Consider it without context
        discussion = None

    validate_registration = asbool(config.get(
        'assembl.validate_registration_emails'))

    old_autoflush = session.autoflush
    session.autoflush = False
    try:
        now = datetime.utcnow()
        user = User(
            name=name,
            password=password,
            verified=not validate_registration,
            creation_date=now
        )

        session.add(user)
        session.flush()

        user.update_from_json(json, user_id=user.id)
        account = user.accounts[0]
        email = account.email
        account.verified = not validate_registration
        if discussion:
            agent_status = AgentStatusInDiscussion(
                agent_profile=user, discussion=discussion,
                first_visit=now, last_visit=now,
                user_created_on_this_discussion=True)
            session.add(agent_status)
        session.flush()

        # create the profile fields for custom fields
        for global_id, value in json.get('profileFields', {}).iteritems():
            configurable_field_id = from_global_id(global_id)[1]
            configurable_field = AbstractConfigurableField.get(configurable_field_id)
            profile_field = ProfileField(
                agent_profile=user,
                configurable_field=configurable_field,
                discussion=configurable_field.discussion,
                value_data={ u'value': value }
            )
            session.add(profile_field)

        session.flush()

        if validate_registration:
            send_confirmation_email(request, account)
        else:
            user.verified = True
            for account in user.accounts:
                account.verified = True
            user.successful_login()
            if asbool(config.get('pyramid.debug_authorization')):
                # for debugging purposes
                from assembl.auth.password import email_token
                print "email token:", request.route_url(
                    'user_confirm_email', token=email_token(account))
            if discussion:
                check_subscription = discussion.preferences['whitelist_on_register']
                maybe_auto_subscribe(user, discussion, check_authorization=check_subscription)
        session.flush()
        return CreationResponse(user, Everyone, permissions)
    finally:
        session.autoflush = old_autoflush


@view_config(
    context=InstanceContext, ctx_instance_class=AbstractAgentAccount,
    request_method='DELETE', renderer='json')
def delete_abstract_agent_account(request):
    ctx = request.context
    user_id = request.authenticated_userid or Everyone
    permissions = get_permissions(
        user_id, ctx.get_discussion_id())
    instance = ctx._instance
    if not instance.user_can(user_id, CrudPermissions.DELETE, permissions):
        return HTTPUnauthorized()
    if instance.email:
        accounts_with_mail = [a for a in instance.profile.accounts if a.email]
        if len(accounts_with_mail) == 1:
            raise JSONError("This is the last account")
        if instance.verified:
            verified_accounts_with_mail = [
                a for a in accounts_with_mail if a.verified]
            if len(verified_accounts_with_mail) == 1:
                raise JSONError("This is the last verified account", code=403)
    instance.db.delete(instance)
    return {}


@view_config(context=InstanceContext, request_method='PATCH',
             header=JSON_HEADER, ctx_instance_class=AbstractAgentAccount,
             renderer='json')
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


@view_config(
    context=InstanceContext, request_method='GET',
    ctx_instance_class=AgentProfile,
    renderer='json', name='interesting_ideas')
def interesting_ideas(request):
    from .discussion import get_analytics_alerts
    ctx = request.context
    target = request.context._instance
    user_id = request.authenticated_userid or Everyone
    discussion_id = ctx.get_discussion_id()
    permissions = get_permissions(
        user_id, discussion_id)
    if P_READ not in permissions:
        raise HTTPUnauthorized()
    if user_id != target.id and P_ADMIN_DISC not in permissions:
        raise HTTPUnauthorized()
    discussion = Discussion.get(discussion_id)
    if not discussion:
        raise HTTPNotFound()
    result = get_analytics_alerts(
        discussion, target.id,
        ["interesting_to_me"], False)
    result = loads(result)['responses'][0]['data'][0]['suggestions']
    result = {x['targetID']: x['arguments']['score'] for x in result}
    return result


@view_config(context=CollectionContext, request_method='POST', renderer="json",
             header=JSON_HEADER, ctx_collection_class=UserLanguagePreference)
def add_user_language_preference(request):
    ctx = request.context
    user_id = request.authenticated_userid or Everyone
    permissions = get_permissions(
        user_id, ctx.get_discussion_id())
    check_permissions(ctx, user_id, permissions, CrudPermissions.CREATE)
    typename = ctx.collection_class.external_typename()
    json = request.json_body
    try:
        instances = ctx.create_object(typename, json, user_id)
    except ObjectNotUniqueError as e:
        raise JSONError(str(e), code=409)
    except Exception as e:
        raise HTTPBadRequest(e)
    if instances:
        first = instances[0]
        db = first.db
        for instance in instances:
            db.add(instance)
        db.flush()
        view = request.GET.get('view', None) or 'default'
        return CreationResponse(first, user_id, permissions, view)


@view_config(context=InstanceContext, request_method='PUT', renderer="json",
             header=JSON_HEADER, ctx_instance_class=UserLanguagePreference)
@view_config(context=InstanceContext, request_method='PATCH', renderer="json",
             header=JSON_HEADER, ctx_instance_class=UserLanguagePreference)
def modify_user_language_preference(request):
    json_data = request.json_body
    ctx = request.context
    user_id = request.authenticated_userid or Everyone
    permissions = get_permissions(
        user_id, ctx.get_discussion_id())
    instance = ctx._instance
    if not instance.user_can(user_id, CrudPermissions.UPDATE, permissions):
        return HTTPUnauthorized()
    try:
        updated = instance.update_from_json(json_data, user_id, ctx)
        view = request.GET.get('view', None) or 'default'
        if view == 'id_only':
            return [updated.uri()]
        else:
            return updated.generic_json(view, user_id, permissions)

    except NotImplemented:
        raise HTTPNotImplemented()
    except ObjectNotUniqueError as e:
        raise JSONError(str(e), code=409)
