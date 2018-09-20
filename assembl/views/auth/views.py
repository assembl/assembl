from datetime import datetime
import simplejson as json
from urllib import quote
from smtplib import SMTPRecipientsRefused
from email.header import Header
import logging

from pyramid.i18n import TranslationStringFactory
from pyramid.view import view_config
from pyramid_mailer import get_mailer
from pyramid_mailer.message import Message
from pyramid.renderers import render_to_response
from pyramid.security import (
    remember,
    forget,
    Everyone,
    Authenticated,
    NO_PERMISSION_REQUIRED)
from pyramid.httpexceptions import (
    HTTPUnauthorized,
    HTTPFound,
    HTTPNotFound,
    HTTPBadRequest,
    HTTPServerError)
from pyramid.settings import asbool, aslist
from sqlalchemy import desc
from pyisemail import is_email
from social_core.actions import do_auth
from social_pyramid.utils import psa
from social_core.exceptions import (
    AuthException, AuthFailed, AuthCanceled, AuthUnknownError,
    AuthMissingParameter, AuthStateMissing, AuthStateForbidden,
    AuthTokenError)


from assembl.models import (
    EmailAccount, IdentityProvider, SocialAuthAccount,
    AgentProfile, User, Username, Role, LocalUserRole, Preferences,
    AbstractAgentAccount, Discussion, AgentStatusInDiscussion)
from assembl.auth import (
    P_READ, R_PARTICIPANT, P_SELF_REGISTER, P_SELF_REGISTER_REQUEST)
from assembl.auth.password import (
    verify_email_token, verify_password_change_token,
    password_change_token, Validity, get_data_token_time)
from assembl.auth.util import (
    discussion_from_request, roles_with_permissions, maybe_auto_subscribe,
    get_permissions)
from assembl.auth.social_auth import maybe_social_logout
from ...lib import config
from assembl.lib.sqla_types import EmailString
from assembl.lib.utils import normalize_email_name, get_global_base_url
from .. import (
    get_default_context, JSONError, get_provider_data,
    HTTPTemporaryRedirect, create_get_route, sanitize_next_view)

_ = TranslationStringFactory('assembl')
log = logging.getLogger('assembl')


public_roles = {Everyone, Authenticated}


def get_login_context(request, force_show_providers=False):
    slug = request.matchdict.get('discussion_slug', None)
    if slug:
        request.session['discussion'] = slug
    else:
        request.session.pop('discussion')
    discussion = discussion_from_request(request)
    get_routes = create_get_route(request, discussion)
    providers = get_provider_data(get_routes)
    hide_registration = (discussion
        and not public_roles.intersection(set(roles_with_permissions(
            discussion, P_READ)))
        and not roles_with_permissions(
            discussion, P_SELF_REGISTER_REQUEST, P_SELF_REGISTER))
    if not force_show_providers:
        hide_providers = aslist(request.registry.settings.get(
            'hide_login_providers', ()))

        if isinstance(hide_providers, (str, unicode)):
            hide_providers = (hide_providers, )
        providers = [p for p in providers if p['type'] not in hide_providers]

    return dict(get_default_context(request),
                providers=providers,
                providers_json=json.dumps(providers),
                saml_providers=request.registry.settings.get(
                    'SOCIAL_AUTH_SAML_ENABLED_IDPS', {}),
                hide_registration=hide_registration,
                identifier = request.params.get('identifier', ''),
                google_consumer_key=request.registry.settings.get(
                    'google.consumer_key', ''),
                next=handle_next_view(request),
                get_route=get_routes)

def _get_route_from_path(request, path):
    from pyramid.urldispatch import IRoutesMapper
    rm = request.registry.getUtility(IRoutesMapper)
    for route in rm.routelist:
        match = route.match(path)
        if match is not None:
            return route, match
    return None, {}


def handle_next_view(request, consume=False, default_suffix='home'):
    next_value = sanitize_next_view(request.params.get('next', None))
    if next_value:
        return next_value
    else:
        slug = request.matchdict.get('discussion_slug', None)
        if slug:
            default = "/".join((x for x in ('', slug, default_suffix)
                                if x is not None))
            return default
        else:
            return "/"


def maybe_contextual_route(request, route_name, **args):
    # TODO : Update this logic, as it uses session storage to identify slug as well,
    # it is called from places where session might not be a good idea.
    discussion_slug = None
    if request.matchdict:
        discussion_slug = request.matchdict.get('discussion_slug', None)
    if discussion_slug is None:
        discussion = discussion_from_request(request)
        if discussion:
            discussion_slug = discussion.slug
    if discussion_slug is None:
        return request.route_url(route_name, **args)
    else:
        return request.route_url(
            'contextual_' + route_name,
            discussion_slug=discussion_slug, **args)


def get_social_autologin(request, discussion=None, next_view=None):
    """Look for a mandatory social login

    :param discussion: The discussion object
    :param next_view: None|Boolean|string The potential next_view to be appended
    """
    discussion = discussion or discussion_from_request(request)
    if discussion:
        preferences = discussion.preferences
    else:
        preferences = Preferences.get_default_preferences()
    auto_login_backend = preferences['authorization_server_backend']
    landing_page = preferences['landing_page']
    if not auto_login_backend:
        return None
    use_next_view = True
    if next_view is False:
        use_next_view = False
    next_view = sanitize_next_view(next_view or request.params.get('next', None))
    if discussion and not next_view and use_next_view:
        if landing_page:
            next_view = request.route_path('new_home',
                                           discussion_slug=discussion.slug)
        else:
            next_view = request.route_path('home',
                                           discussion_slug=discussion.slug)
    if use_next_view:
        query = {"next": next_view}
    else:
        query = {}
    if ":" in auto_login_backend:
        auto_login_backend, provider = auto_login_backend.split(":", 1)
        query['idp'] = provider
    if discussion:
        return request.route_url(
            "contextual_social.auth",
            discussion_slug=discussion.slug,
            backend=auto_login_backend,
            _query=query)
    else:
        return request.route_url(
            "social.auth",
            backend=auto_login_backend,
            _query=query)


@view_config(
    route_name='logout', request_method='GET',
    renderer='assembl:templates/login.jinja2',
)
@view_config(
    route_name='contextual_logout', request_method='GET',
    renderer='assembl:templates/login.jinja2',
)
def logout(request):
    logout_url = maybe_social_logout(request)
    forget(request)
    if logout_url:
        return HTTPFound(location=logout_url)
    next_view = handle_next_view(request, True)
    return HTTPFound(location=next_view)


@view_config(
    route_name='login',
    request_method='GET', http_cache=60,
    renderer='assembl:templates/login.jinja2',
)
@view_config(
    route_name='contextual_login',
    request_method='GET', http_cache=60,
    renderer='assembl:templates/login.jinja2',
)
@view_config(
    route_name='login_forceproviders',
    request_method='GET', http_cache=60,
    renderer='assembl:templates/login.jinja2',
)
@view_config(
    route_name='contextual_login_forceproviders',
    request_method='GET', http_cache=60,
    renderer='assembl:templates/login.jinja2',
)
def login_view(request):
    if request.scheme == "http"\
            and asbool(config.get("accept_secure_connection")):
        return HTTPFound(get_global_base_url(True) + request.path_qs)
    force_providers = request.matched_route.name.endswith('_forceproviders')
    if request.matched_route.name == 'contextual_login':
        contextual_login = get_social_autologin(request)
        if contextual_login:
            return HTTPFound(contextual_login)
    return get_login_context(request, force_providers)


def get_profile(request):
    id_type = request.matchdict.get('type').strip()
    identifier = request.matchdict.get('identifier').strip()
    session = AgentProfile.default_db
    if id_type == 'u':
        username = session.query(Username).filter_by(
            username=identifier).first()
        if not username:
            raise HTTPNotFound()
        profile = username.user
    elif id_type == 'id':
        try:
            id = int(identifier)
        except:
            raise HTTPNotFound()
        profile = session.query(AgentProfile).get(id)
        if not profile:
            raise HTTPNotFound()
    elif id_type == 'email':
        account = session.query(AbstractAgentAccount).filter_by(
            email_ci=identifier).order_by(desc(
                AbstractAgentAccount.verified)).first()
        if not account:
            raise HTTPNotFound()
        profile = account.profile
    else:
        # TODO: CHECK if we're looking at username or uid
        account = session.query(SocialAuthAccount).join(
            IdentityProvider).filter(
                SocialAuthAccount.username == identifier and
                IdentityProvider.type == id_type).first()
        if not account:
            raise HTTPNotFound()
        profile = account.profile
    return profile


@view_config(route_name='profile_user', request_method=("GET", "POST"))
def assembl_profile(request):
    session = AgentProfile.default_db
    localizer = request.localizer
    profile = get_profile(request)
    id_type = request.matchdict.get('type').strip()
    logged_in = request.authenticated_userid
    save = request.method == 'POST'
    # if some other user
    if not profile or not logged_in or logged_in != profile.id:
        if save:
            raise HTTPUnauthorized()
        # Add permissions to view a profile?
        return render_to_response(
            'assembl:templates/view_profile.jinja2',
            dict(get_default_context(request),
                 profile=profile,
                 user=logged_in and session.query(User).get(logged_in)))

    confirm_email = request.params.get('confirm_email', None)
    if confirm_email:
        return HTTPTemporaryRedirect(location=request.route_url(
            'confirm_emailid_sent', email_account_id=int(confirm_email)))
    errors = []
    if save:
        user_id = profile.id
        redirect = False
        username = request.params.get('username', '').strip()
        if username and (
                profile.username is None
                or username != profile.username.username):
            # check if exists
            if session.query(Username).filter_by(username=username).count():
                errors.append(localizer.translate(_(
                    'The username %s is already used')) % (username,))
            else:
                old_username = profile.username
                if old_username is not None:
                    # free existing username
                    session.delete(old_username)
                    session.flush()
                # add new username
                session.add(Username(username=username, user=profile))

                if id_type == 'u':
                    redirect = True
        name = request.params.get('name', '').strip()
        if name:
            profile.name = name
        p1, p2 = (request.params.get('password1', '').strip(),
                  request.params.get('password2', '').strip())
        if p1 != p2:
            errors.append(localizer.translate(_(
                'The passwords are not identical')))
        elif p1:
            profile.password_p = p1
        add_email = request.params.get('add_email', '').strip()
        if add_email:
            if not is_email(add_email):
                return dict(get_default_context(request),
                            error=localizer.translate(_(
                                "This is not a valid email")))
            # No need to check presence since not validated yet
            email = EmailAccount(
                email=add_email, profile=profile)
            session.add(email)
        if redirect:
            return HTTPFound(location=request.route_url(
                'profile_user', type='u', identifier=username))
        profile = session.query(User).get(user_id)
    unverified_emails = [
        (ea, session.query(AbstractAgentAccount).filter_by(
            email_ci=ea.email_ci, verified=True).first())
        for ea in profile.email_accounts if not ea.verified]
    get_route = create_get_route(request)
    providers = get_provider_data(get_route)
    return render_to_response(
        'assembl:templates/profile.jinja2',
        dict(get_default_context(request),
             error='<br />'.join(errors),
             unverified_emails=unverified_emails,
             providers=providers,
             providers_json=json.dumps(providers),
             google_consumer_key=request.registry.settings.get(
                 'google.consumer_key', ''),
             the_user=profile,
             user=session.query(User).get(logged_in)))


@view_config(route_name='avatar', request_method="GET")
def avatar(request):
    profile = get_profile(request)
    size = int(request.matchdict.get('size'))
    if profile:
        gravatar_url = profile.avatar_url(size, request.application_url)
        return HTTPFound(location=gravatar_url)
    default = request.registry.settings.get(
        'avatar.default_image_url', '') or \
        request.application_url+'/static/img/icon/user.png'
    return HTTPFound(location=default)


@view_config(
    route_name='register', request_method=("GET", "POST"),
    permission=NO_PERMISSION_REQUIRED,
    renderer='assembl:templates/register.jinja2'
)
@view_config(
    route_name='contextual_register', request_method=("GET", "POST"),
    permission=NO_PERMISSION_REQUIRED,
    renderer='assembl:templates/register.jinja2'
)
def assembl_register_view(request):
    slug = request.matchdict.get('discussion_slug', "")
    next_view = handle_next_view(request)
    if not request.params.get('email'):
        if request.scheme == "http"\
                and asbool(config.get("accept_secure_connection")):
            return HTTPFound(get_global_base_url(True) + request.path_qs)
        response = get_login_context(request)
        return response
    forget(request)
    session = AgentProfile.default_db
    localizer = request.localizer
    name = request.params.get('name', '').strip()
    if not name or len(name) < 3:
        return dict(get_default_context(request),
            error=localizer.translate(_(
                "Please use a name of at least 3 characters")))
    password = request.params.get('password', '').strip()
    password2 = request.params.get('password2', '').strip()
    email = request.params.get('email', '').strip()
    if not is_email(email):
        return dict(get_default_context(request),
                    error=localizer.translate(_(
                        "This is not a valid email")))
    email = EmailString.normalize_email_case(email)
    # Find agent account to avoid duplicates!
    if session.query(AbstractAgentAccount).filter_by(
            email_ci=email, verified=True).count():
        return dict(get_default_context(request),
                    error=localizer.translate(_(
                        "We already have a user with this email.")))
    if password != password2:
        return dict(get_default_context(request),
                    error=localizer.translate(_(
                        "The passwords should be identical")))

    # TODO: Validate password quality
    # otherwise create.
    validate_registration = asbool(config.get(
        'assembl.validate_registration_emails'))

    user = User(
        name=name,
        password=password,
        verified=not validate_registration,
        creation_date=datetime.utcnow()
    )
    email_account = EmailAccount(
        email=email,
        verified=not validate_registration,
        profile=user
    )
    session.add(user)
    session.add(email_account)
    discussion = discussion_from_request(request)
    if discussion:
        permissions = get_permissions(Everyone, discussion.id)
        if not (P_SELF_REGISTER in permissions or
                P_SELF_REGISTER_REQUEST in permissions):
            discussion = None
    if discussion:
        _now = datetime.utcnow()
        agent_status = AgentStatusInDiscussion(
            agent_profile=user, discussion=discussion,
            first_visit=_now, last_visit=_now,
            user_created_on_this_discussion=True)
        session.add(agent_status)
    session.flush()
    if not validate_registration:
        if asbool(config.get('pyramid.debug_authorization')):
            # for debugging purposes
            from assembl.auth.password import email_token
            print "email token:", request.route_url(
                'user_confirm_email', token=email_token(email_account))
        headers = remember(request, user.id)
        user.successful_login()
        request.response.headerlist.extend(headers)
        if discussion:
            maybe_auto_subscribe(user, discussion)
        # TODO: Tell them to expect an email.
        return HTTPFound(location=next_view)
    return HTTPFound(location=maybe_contextual_route(
        request, 'confirm_emailid_sent', email_account_id=email_account.id))


@view_config(context=SMTPRecipientsRefused)
def smtp_error_view(exc, request):
    path_info = request.environ['PATH_INFO']
    localizer = request.localizer
    message = localizer.translate(_(
            "Your email was refused by the SMTP server.  You probably entered an email that does not exist."))
    if path_info.startswith('/data/') or path_info.startswith('/api/'):
        return JSONError(message)
    referrer = request.environ['HTTP_REFERER']
    request.session.flash(message)
    referrer = referrer.split('?')[0]
    return HTTPFound(location=referrer)


def from_identifier(identifier):
    session = AgentProfile.default_db
    if '@' in identifier:
        identifier = EmailString.normalize_email_case(identifier)
        account = session.query(AbstractAgentAccount).filter_by(
            email_ci=identifier).order_by(AbstractAgentAccount.verified.desc()).first()
        if account:
            user = account.profile
            return (user, account)
    else:
        username = session.query(Username).filter_by(
            username=identifier).first()
        if username:
            return (username.user, None)
    return None, None


@view_config(
    route_name='login',
    request_method='POST',
    permission=NO_PERMISSION_REQUIRED,
)
@view_config(
    route_name='contextual_login',
    request_method='POST',
    permission=NO_PERMISSION_REQUIRED,
)
def assembl_login_complete_view(request):
    """
    This backend view handles login form submissions received from both v1 and v2 frontend views.
    Check if proper authorization. Otherwise send to another page.
    """
    session = AgentProfile.default_db
    # POST before GET
    identifier = (request.POST.get('identifier').strip() or
                  request.GET.get('identifier').strip() or '')
    password = request.params.get('password', '').strip()
    referrer = request.POST.get('referrer', None)
    is_v2 = True if referrer == 'v2' else False
    next_view = handle_next_view(request, True)
    logged_in = request.authenticated_userid
    localizer = request.localizer
    user = None
    user, account = from_identifier(identifier)
    query = {"identifier": identifier,
             "next": next_view} if identifier else {"next": next_view}
    if not user:
        error_message = localizer.translate(_("This user cannot be found"))
        request.session.flash(error_message)
        route_name = 'react_login' if is_v2 else 'login'
        return HTTPFound(location=maybe_contextual_route(
            request, route_name,
            _query=query))
    if account and not account.verified:
        return HTTPFound(location=maybe_contextual_route(
            request, 'confirm_emailid_sent', email_account_id=account.id))
    if logged_in:
        if user.id != logged_in:
            # logging in as a different user
            # Could I be combining account?
            forget(request)
        else:
            # re-logging in? Why?
            return HTTPFound(location=next_view)
    if not user.check_password(password):
        error_message = localizer.translate(_("Invalid user and password"))
        user.login_failures += 1
        # TODO: handle high failure count
        request.session.flash(error_message)
        route_name = 'react_login' if is_v2 else 'login'
        return HTTPFound(location=maybe_contextual_route(
            request, route_name,
            _query=query))
    user.successful_login()
    headers = remember(request, user.id)
    request.response.headerlist.extend(headers)
    discussion = discussion_from_request(request)
    if discussion:
        maybe_auto_subscribe(user, discussion)
    return HTTPFound(location=next_view)


@view_config(route_name="contextual_social.auth", request_method=('GET', 'POST'))
@psa('social.complete')
def auth(request):
    forget(request)
    request.session['discussion'] = request.matchdict['discussion_slug']
    request.session['add_account'] = False
    return do_auth(request.backend, redirect_name='next')


@view_config(route_name="add_social_account", request_method=('GET', 'POST'))
@view_config(
    route_name="contextual_add_social_account", request_method=('GET', 'POST'))
@psa('social.complete')
def add_social_account(request):
    request.session['discussion'] = request.matchdict['discussion_slug']
    request.session['add_account'] = True
    # TODO: Make False later.
    return do_auth(request.backend, redirect_name='next')


@view_config(
    route_name='confirm_emailid_sent', request_method=("GET", "POST"),
    renderer='assembl:templates/confirm.jinja2',
    permission=NO_PERMISSION_REQUIRED
)
@view_config(
    route_name='contextual_confirm_emailid_sent', request_method=("GET", "POST"),
    renderer='assembl:templates/confirm.jinja2',
    permission=NO_PERMISSION_REQUIRED
)
def confirm_emailid_sent(request):
    # TODO: How to make this not become a spambot?
    id = int(request.matchdict.get('email_account_id'))
    email = AbstractAgentAccount.get(id)
    if not email:
        raise HTTPNotFound()
    localizer = request.localizer
    context = get_default_context(request)
    if email.verified:
        # Your email is fine, why do you want to confirm it?
        # Temporary: explain, but it's a dead-end.
        # TODO: Unlog and redirect to login.
        return dict(
            context,
            profile_id=email.profile_id,
            action = context['get_route']("confirm_emailid_sent", email_account_id=id),
            email_account_id=str(id),
            title=localizer.translate(_('This email address is already confirmed')),
            description=localizer.translate(_(
                'You do not need to confirm this email address, it is already confirmed.')))
    send_confirmation_email(request, email)
    return dict(
        get_default_context(request),
        action = context['get_route']("confirm_emailid_sent", email_account_id=id),
        profile_id=email.profile_id,
        email_account_id=request.matchdict.get('email_account_id'),
        title=localizer.translate(_('Confirmation requested')),
        description=localizer.translate(_(
            'A confirmation e-mail has been sent to your account and should be in your inbox in a few minutes. '
            'It contains a confirmation link, please click on it in order to confirm your e-mail address. '
            'If you did not receive any confirmation e-mail (check your spams), click here.')))


@view_config(
    route_name='user_confirm_email', request_method="GET",
    renderer='assembl:templates/email_confirmed.jinja2',
    permission=NO_PERMISSION_REQUIRED
)
@view_config(
    route_name='contextual_user_confirm_email', request_method="GET",
    renderer='assembl:templates/email_confirmed.jinja2',
    permission=NO_PERMISSION_REQUIRED
)
def user_confirm_email(request):
    token = request.matchdict.get('token') or ''
    account, validity = verify_email_token(token)
    session = AbstractAgentAccount.default_db
    logged_in = request.authenticated_userid  # if mismatch?
    localizer = request.localizer
    if account and account.profile_id != logged_in:
        # token for someone else: forget login.
        logged_in = None
        forget(request)
    token_date = get_data_token_time(token)
    old_token = (
        account is None or token_date is None or (
            account.profile.last_login and token_date < account.profile.last_login))
    inferred_discussion = discussion = discussion_from_request(request)
    if account and not discussion:
        # We do not know from which discussion the user started to log in;
        # See if only involved in one discussion
        discussions = account.profile.involved_in_discussion
        if len(discussions) == 1:
            inferred_discussion = discussions[0]
    if account and account.verified and logged_in:
        # no need to revalidate, just send to discussion.
        # Question: maybe_auto_subscribe? Doubt it.
        if inferred_discussion:
            if inferred_discussion.preferences['landing_page']:
                route = 'new_home'
            else:
                route = 'home'
        else:
            route = 'discussion_list'
        error = localizer.translate(
            _("Email <%s> already confirmed")) % (account.email,)
        request.session.flash(error)
        return HTTPFound(location=request.route_url(
            route,
            discussion_slug=inferred_discussion.slug if inferred_discussion else None))

    if validity != Validity.VALID or old_token:
        # V-, B-: Invalid or obsolete token
        # Offer to send a new token
        if account and not account.verified:
            # bad token, unverified account... offer a new token
            if validity != Validity.VALID:
                error = localizer.translate(_(
                    "This link was not valid. We sent another."))
            else:
                error = localizer.translate(_(
                    "This link has been used. We sent another."))
            request.session.flash(error)
            return HTTPFound(location=maybe_contextual_route(
                request, 'confirm_emailid_sent', email_account_id=account.id))
        else:
            if account and account.verified:
                # bad token, verified account... send them to login
                error = localizer.translate(
                    _("Email <%s> already confirmed")) % (account.email,)
            else:
                # now what? We do not have the email.
                # Just send to login for now
                error = localizer.translate(_(
                    "This link is not valid. Please attempt to login to get another one."))
            request.session.flash(error)
            return HTTPFound(location=maybe_contextual_route(
                request, 'react_login', _query=dict(
                    identifier=account.email if account else None)))

    # By now we know we have a good token; make it login-equivalent.
    user = account.profile
    assert isinstance(user, User)  # accounts should not get here. OK to fail.
    headers = remember(request, user.id)
    request.response.headerlist.extend(headers)
    user.successful_login()
    username = user.username.username if user.username else None
    next_view = handle_next_view(request, False)

    if account.verified:
        message = localizer.translate(
            _("Email <%s> already confirmed")) % (account.email,)
    else:
        # maybe another profile already verified that email
        other_account = session.query(AbstractAgentAccount).filter_by(
            email_ci=account.email_ci, verified=True).first()
        if other_account:
            # We have two versions of the email, delete the unverified one
            session.delete(account)
            if other_account.profile != user:
                # Give priority to the one where the email was verified last.
                other_profile = other_account.profile
                user.merge(other_profile)
                session.delete(other_profile)
                if user.username:
                    username = user.username.username
            account = other_account
        account.verified = True
        user.verified = True
        # do not use inferred discussion for auto_subscribe
        user.successful_login()
        if discussion and maybe_auto_subscribe(user, discussion):
            message = localizer.translate(_(
                "Your email address %s has been confirmed, "
                "and you are now subscribed to discussion's "
                "default notifications.")) % (account.email,)
        else:
            message = localizer.translate(_(
                "Your email address %s has been confirmed."
                )) % (account.email,)

    if inferred_discussion:
        if inferred_discussion.preferences['landing_page']:
            route = 'new_home'
        else:
            route = 'home'
    else:
        route = 'discussion_list'
    return HTTPFound(location=request.route_url(
        route,
        discussion_slug=inferred_discussion.slug
        if inferred_discussion else None,
        _query=dict(message=message)))


@view_config(
    context=AuthException,  # maybe more specific?
    renderer='assembl:templates/login.jinja2',
)
def login_denied_view(request):
    # TODO: Go to appropriate login page, and flash error message.
    localizer = request.localizer
    request.session.flash(localizer.translate(_('Login failed, try again')))
    get_route = create_get_route(request)
    return HTTPFound(location=get_route('react_login',
                     _query=request.GET or None))


@view_config(
    route_name='confirm_email_sent', request_method=("GET", "POST"),
    renderer='assembl:templates/confirm.jinja2',
    permission=NO_PERMISSION_REQUIRED
)
@view_config(
    route_name='contextual_confirm_email_sent', request_method=("GET", "POST"),
    renderer='assembl:templates/confirm.jinja2',
    permission=NO_PERMISSION_REQUIRED
)
def confirm_email_sent(request):
    localizer = request.localizer
    # TODO: How to make this not become a spambot?
    email = request.matchdict.get('email')
    if not email:
        raise HTTPNotFound()
    if '@' not in email:
        raise HTTPBadRequest("Not an email")
    email = EmailString.normalize_email_case(email)
    email_objects = AbstractAgentAccount.default_db.query(
        AbstractAgentAccount).filter_by(email_ci=email)
    verified_emails = [e for e in email_objects if e.verified]
    unverified_emails = [e for e in email_objects if not e.verified]
    if len(verified_emails) > 1:
        # TODO!: Merge accounts.
        raise HTTPServerError("Multiple verified emails")
    elif len(verified_emails):
        if len(unverified_emails):
            # TODO!: Send an email, mention duplicates, and...
            # offer to merge accounts?
            # Send an email to other emails of the duplicate? Sigh!
            pass
        return HTTPFound(location=maybe_contextual_route(
            request, 'login', _query=dict(
                identifer=email,
                error=localizer.translate(_(
                    "This email is already confirmed.")))))
    else:
        if len(unverified_emails):
            # Normal case: Send an email. May be spamming
            for email_account in unverified_emails:
                send_confirmation_email(request, email_account)
            context = get_default_context(request)
            return dict(
                context,
                action=context['get_route']("confirm_email_sent", email=email),
                email=email,
                title=localizer.translate(_('Confirmation requested')),
                description=localizer.translate(_(
                    'A confirmation e-mail has been sent to your account and should be in your inbox in a few minutes. '
                    'It contains a confirmation link, please click on it in order to confirm your e-mail address. '
                    'If you did not receive any confirmation e-mail (check your spams), click here.')))
        else:
            # We do not have an email to this name.
            return HTTPFound(location=maybe_contextual_route(
                request, 'register', email=email, _query=dict(
                    error=localizer.translate(_(
                        "We do not know about this email.")))))


@view_config(
    route_name='request_password_change', request_method=("GET", "POST"),
    renderer='assembl:templates/request_password_change.jinja2',
    permission=NO_PERMISSION_REQUIRED
)
@view_config(
    route_name='contextual_request_password_change', request_method=("GET", "POST"),
    renderer='assembl:templates/request_password_change.jinja2',
    permission=NO_PERMISSION_REQUIRED
)
def request_password_change(request):
    localizer = request.localizer
    identifier = request.params.get('identifier') or ''
    user_id = request.params.get('user_id') or ''
    error = request.params.get('error') or ''
    user = None

    if user_id:
        try:
            user = User.get(int(user_id))
            identifier = identifier or user.get_preferred_email() or ''
        except:
            error = error or localizer.translate(_("This user cannot be found"))
    elif identifier:
        user, account = from_identifier(identifier)
        if user:
            user_id = user.id
        else:
            error = error or localizer.translate(_("This user cannot be found"))
    if error or not user:
        context = get_default_context(request)
        get_route = context['get_route']
        request.session.flash(error)
        return HTTPFound(location=get_route('react_request_password_change'))

    discussion_slug = request.matchdict.get('discussion_slug', None)
    route = 'password_change_sent'
    if discussion_slug:
        route = 'contextual_' + route
    return HTTPFound(location=maybe_contextual_route(
        request, 'password_change_sent', profile_id=user_id,
        _query=dict(email=identifier if '@' in identifier else '')))


@view_config(
    route_name='password_change_sent', request_method=("GET", "POST"),
    renderer='assembl:templates/confirm.jinja2',
    permission=NO_PERMISSION_REQUIRED
)
@view_config(
    route_name='contextual_password_change_sent',
    request_method=("GET", "POST"),
    renderer='assembl:templates/confirm.jinja2',
    permission=NO_PERMISSION_REQUIRED
)
def password_change_sent(request):
    localizer = request.localizer
    if not request.params.get('sent', False):
        profile_id = int(request.matchdict.get('profile_id'))
        profile = AgentProfile.get(profile_id)
        email = request.params.get('email')
        if not profile:
            raise HTTPNotFound("No profile "+str(profile_id))
        else:
            email = email or profile.get_preferred_email()
        discussion = discussion_from_request(request)
        send_change_password_email(request, profile, email,
            discussion=discussion)
    profile_id=int(request.matchdict.get('profile_id'))
    context = get_default_context(request)
    return dict(
        context,
        profile_id=profile_id,
        action = context['get_route']("password_change_sent", profile_id=profile_id),
        error=request.params.get('error'),
        title=localizer.translate(_('Password change requested')),
        description=localizer.translate(_(
            'We have sent you an email with a temporary connection link. '
            'Please use that link to log in and change your password.')))


@view_config(
    route_name='welcome', request_method="GET",
    renderer='assembl:templates/do_password_change.jinja2',
    permission=NO_PERMISSION_REQUIRED
)
@view_config(
    route_name='contextual_welcome', request_method="GET",
    permission=NO_PERMISSION_REQUIRED
)
@view_config(
    route_name='do_password_change', request_method="GET",
    permission=NO_PERMISSION_REQUIRED
)
@view_config(
    route_name='contextual_do_password_change', request_method="GET",
    permission=NO_PERMISSION_REQUIRED
)
def do_password_change(request):
    "Validate the change_password token, and react accordingly."
    # Codes below refer to those cases:
    # V. token Valid(+) or invalid(-)? (Possibly expired through internal date)
    # P. user has(+) a Password or not (-)?
    # W. Welcome(+) vs change password(-)
    # B. last login absent, or Before token created (+) vs last login after token created (-)
    # L. user is already Logged in(+) or not(-)?

    welcome = 'welcome' in request.matched_route.name
    localizer = request.localizer
    discussion = discussion_from_request(request)
    token = request.matchdict.get('token')
    user, validity = verify_password_change_token(token)
    logged_in = request.authenticated_userid
    if user and user.id != logged_in:
        # token for someone else: forget login.
        logged_in = None
        forget(request)
    lacking_password = user is not None and user.password is None
    token_date = get_data_token_time(token)
    old_token = (
        user is None or token_date is None or (
            user.last_login and token_date < user.last_login))
    print "pwc V%sP%sW%sB%sL%s" % tuple(map(lambda b: "-" if b else "+", (
        validity != Validity.VALID, lacking_password, not welcome,
        old_token, logged_in is None)))
    if welcome and not lacking_password:
        # W+P+: welcome link sends onwards irrespective of token
        if logged_in:
            # L+: send onwards to discussion
            return HTTPFound(location=request.route_url(
                'home' if discussion else 'discussion_list',
                discussion_slug=discussion.slug))
        else:
            # L-: offer to login
            return HTTPFound(location=maybe_contextual_route(
                request, 'login', _query=dict(
                identifier=user.get_preferred_email() if user else None)))

    if (validity != Validity.VALID or old_token) and not logged_in:
        # V-, V+P+W-B-L-: Invalid or obsolete token (obsolete+logged in treated later.)
        # Offer to send a new token
        if validity != Validity.VALID:
            error = localizer.translate(_(
                "This link is not valid. Do you want us to send another?"))
        else:
            error = localizer.translate(_(
                "This link has been used. Do you want us to send another?"))
        request.session.flash(error)
        return HTTPFound(location=maybe_contextual_route(
            request, 'request_password_change', _query=dict(
                user_id=user.id if user else '')))

    # V+: Valid token (encompasses P-B+, W-, B-L+); ALSO V-L+
    # V+P-B- should not happen, but we'll treat it the same.
    # go through password change dialog. We'll complete login afterwards.
    if welcome:
        if discussion:
            request.session.flash(localizer.translate(_(
                "You will enter the discussion as <b>{name}</b>.")
                ).format(name=user.name), 'message')
        else:
            request.session.flash(localizer.translate(_(
                "You will enter Assembl as <b>{name}</b>.")
                ).format(name=user.name), 'message')
        request.session.flash(localizer.translate(_(
                "Please choose your password for security reasons.")
                ).format(name=user.name), 'message')
    return HTTPFound(location=maybe_contextual_route(
            request, 'react_do_password_change', _query=dict(
                token=token, welcome=welcome)))


@view_config(
    route_name='finish_password_change', request_method=("GET", "POST"),
    renderer='assembl:templates/do_password_change.jinja2',
    permission=NO_PERMISSION_REQUIRED
)
@view_config(
    route_name='contextual_finish_password_change',
    request_method=("GET", "POST"), permission=NO_PERMISSION_REQUIRED,
    renderer='assembl:templates/do_password_change.jinja2',
)
def finish_password_change(request):
    localizer = request.localizer
    token = request.params.get('token')
    title = request.params.get('title')
    welcome = asbool(request.params.get('welcome'))
    discussion = discussion_from_request(request)
    if welcome:
        title = localizer.translate(_(
            'Welcome to {discussion_topic}.')).format(
            discussion_topic=discussion.topic if discussion else "Assembl")
    else:
        title = localizer.translate(_('Change your password'))

    user, validity = verify_password_change_token(token)
    logged_in = request.authenticated_userid  # if mismatch?
    if user and user.id != logged_in:
        # token for someone else: forget login.
        logged_in = None
        forget(request)
    token_date = get_data_token_time(token)
    old_token = (
        user is None or token_date is None or (
            user.last_login and token_date < user.last_login))

    if (validity != Validity.VALID or old_token) and not logged_in:
        # V-, V+P+W-B-L-: Invalid or obsolete token (obsolete+logged in treated later.)
        # Offer to send a new token
        if validity != Validity.VALID:
            error = localizer.translate(_(
                "This link is not valid. Do you want us to send another?"))
        else:
            error = localizer.translate(_(
                "This link has been used. Do you want us to send another?"))
        request.session.flash(error)
        return HTTPFound(location=maybe_contextual_route(
            request, 'request_password_change', _query=dict(
                user_id=user.id if user else '')))

    error = None
    p1, p2 = (request.params.get('password1', '').strip(),
              request.params.get('password2', '').strip())
    if p1 != p2:
        error = localizer.translate(_('The passwords are not identical'))
    elif p1:
        user.password_p = p1
        user.successful_login()
        headers = remember(request, user.id)
        request.response.headerlist.extend(headers)
        if discussion:
            maybe_auto_subscribe(user, discussion)
        request.session.flash(localizer.translate(_(
            "Password changed")), 'message')
        return HTTPFound(location=request.route_url(
            'home' if discussion else 'discussion_list',
            discussion_slug=discussion.slug))

    return dict(
        get_default_context(request),
        title=title, token=token, error=error)


def send_confirmation_email(request, email, immediate=False):
    mailer = get_mailer(request)
    localizer = request.localizer
    confirm_what = localizer.translate(_('email'))
    subject = localizer.translate(_("Please confirm your {confirm_what} with {assembl}"))
    if isinstance(email.profile, User) and not email.profile.verified:
        confirm_what = localizer.translate(_('account'))
        text_message = localizer.translate(_(u"""Hello, {name}, and welcome to {assembl}!

Please confirm your email address and complete your registration by clicking the link below.
<{confirm_url}>

Best regards,
The {assembl} Team"""))
        html_message = localizer.translate(_(u"""<p>Hello, {name}, and welcome to {assembl}!</p>
<p>Please <a href="{confirm_url}">click here to confirm your email address</a>
and complete your registration.</p>
<p>Best regards,<br />The {assembl} Team</p>"""))
    else:
        text_message = localizer.translate(_(u"""Hello, {name}!

Please confirm your new email address <{email}> on your {assembl} account by clicking the link below.
<{confirm_url}>

Best regards,
The {assembl} Team"""))
        html_message = localizer.translate(_(u"""<p>Hello, {name}!</p>
<p>Please <a href="{confirm_url}">click here to confirm your new email address</a>
on your {assembl} account.</p>
<p>Best regards,<br />The {assembl} Team</p>"""))

    from assembl.auth.password import email_token
    data = dict(
        name=email.profile.name,
        email=email.email,
        assembl="Assembl",
        confirm_what=confirm_what,
        confirm_url=maybe_contextual_route(
            request, 'user_confirm_email',
            token=email_token(email))
    )
    message = Message(
        subject=subject.format(**data),
        sender=config.get('assembl.admin_email'),
        recipients=["%s <%s>" % (email.profile.name, email.email)],
        body=text_message.format(**data),
        html=html_message.format(**data))
    if immediate:
        mailer.send_immediately(message)
    else:
        mailer.send(message)


def send_change_password_email(
        request, profile, email=None, subject=None,
        text_body=None, html_body=None, discussion=None,
        sender_name=None, welcome=False, immediate=False):
    mailer = get_mailer(request)
    localizer = request.localizer
    route_maker = create_get_route(request, discussion)
    data = dict(
        assembl="Assembl", name=profile.name,
        confirm_url=get_global_base_url() + route_maker(
            'welcome' if welcome else 'do_password_change',
            token=password_change_token(profile)))
    sender_email = config.get('assembl.admin_email')
    if discussion:
        data.update(dict(
            discussion_topic=discussion.topic,
            discussion_url=discussion.get_url()))
        sender_name = sender_name or discussion.topic
    if sender_name:
        sender_name = normalize_email_name(sender_name)
        sender = '"%s" <%s>' % (sender_name, sender_email)
        sender_name = Header(sender_name, 'utf-8').encode()
        if len(sender) > 255:
            sender = sender_email
    else:
        sender = sender_email
    subject = (subject or localizer.translate(
        _("Request for password change"))).format(**data)
    #subject = Header(subject, 'utf-8').encode()  # Fails in some cases???
    if text_body is None or html_body is not None:
        # if text_body and no html_body, html_body remains None.
        html_body = html_body or localizer.translate(_(u"""<p>Hello, {name}!</p>
<p>We have received a request to change the password on your {assembl} account.
Please <a href="{confirm_url}">click here to confirm your password change</a>.</p>
<p>If you did not ask to reset your password please disregard this email.</p>
<p>Best regards,<br />The {assembl} Team</p>
"""))
    text_body = text_body or localizer.translate(_(u"""Hello, {name}!
We have received a request to change the password on your {assembl} account.
To confirm your password change please click on the link below.
<{confirm_url}>

If you did not ask to reset your password please disregard this email.

Best regards,
The {assembl} Team
"""))
    message = Message(
        subject=subject,
        sender=sender,
        recipients=["%s <%s>" % (
            profile.name, email or profile.get_preferred_email())],
        body=text_body.format(**data), html=html_body.format(**data))
    if immediate:
        mailer.send_immediately(message)
    else:
        mailer.send(message)
