from datetime import datetime
import simplejson as json
from urllib import quote
from smtplib import SMTPRecipientsRefused
from email.header import Header
import logging
import re


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
    authenticated_userid,
    NO_PERMISSION_REQUIRED)
from pyramid.httpexceptions import (
    HTTPUnauthorized,
    HTTPFound,
    HTTPNotFound,
    HTTPBadRequest,
    HTTPServerError)
from pyramid.settings import asbool
from bs4 import UnicodeDammit
from sqlalchemy import desc
from pyisemail import is_email
from social.actions import do_auth
from social.apps.pyramid_app.utils import psa
from social.exceptions import (
    AuthException, AuthFailed, AuthCanceled, AuthUnknownError,
    AuthMissingParameter, AuthStateMissing, AuthStateForbidden,
    AuthTokenError)


from assembl.models import (
    EmailAccount, IdentityProvider, SocialAuthAccount,
    AgentProfile, User, Username, Role, LocalUserRole,
    AbstractAgentAccount, Discussion, AgentStatusInDiscussion)
from assembl.auth import (
    P_READ, R_PARTICIPANT, P_SELF_REGISTER, P_SELF_REGISTER_REQUEST)
from assembl.auth.password import (
    verify_email_token, verify_password_change_token,
    password_change_token, Validity, get_data_token_time)
from assembl.auth.util import (
    discussion_from_request, roles_with_permissions, maybe_auto_subscribe)
from ...lib import config
from assembl.lib.sqla_types import EmailString
from .. import (
    get_default_context, JSONError, get_providers_with_names,
    HTTPTemporaryRedirect)

_ = TranslationStringFactory('assembl')
log = logging.getLogger('assembl')


public_roles = {Everyone, Authenticated}


def get_login_context(request, force_show_providers=False):
    slug = request.matchdict.get('discussion_slug', None)
    if slug:
        p_slug = "/" + slug
        request.session['discussion'] = slug
    else:
        p_slug = ""
        request.session.pop('discussion')
    providers = get_providers_with_names()
    discussion = discussion_from_request(request)
    hide_registration = (discussion
        and not public_roles.intersection(set(roles_with_permissions(
            discussion, P_READ)))
        and not roles_with_permissions(
            discussion, P_SELF_REGISTER_REQUEST, P_SELF_REGISTER))
    if not force_show_providers:
        hide_providers = request.registry.settings.get(
            'hide_login_providers', ())

        if isinstance(hide_providers, (str, unicode)):
            hide_providers = (hide_providers, )
        for provider in hide_providers:
            del providers[provider]

    return dict(get_default_context(request),
                slug_prefix=p_slug,
                providers=providers,
                hide_registration=hide_registration,
                identifier = request.params.get('identifier', ''),
                google_consumer_key=request.registry.settings.get(
                    'google.consumer_key', ''),
                next=handle_next_view(request))

def _get_route_from_path(request, path):
    from pyramid.urldispatch import IRoutesMapper
    rm = request.registry.getUtility(IRoutesMapper)
    for route in rm.routelist:
        match = route.match(path)
        if match is not None:
            return route, match
    return None, {}


def handle_next_view(request, consume=False, default_suffix=''):
    slug = request.matchdict.get('discussion_slug', None)
    default = "/".join((x for x in ('', slug, default_suffix)
                        if x is not None))
    return request.params.get('next', None) or default


def maybe_contextual_route(request, route_name, **args):
    discussion_slug = request.matchdict.get('discussion_slug', None)
    if discussion_slug is None:
        discussion_id = request.matchdict.get('discussion_id', None)
        if discussion_id is None:
            return request.route_url(route_name, **args)
        else:
            discussion = Discussion.get(int(discussion_id))
            return request.route_url(
                'contextual_'+route_name,
                discussion_slug=discussion.slug, **args)
    else:
        return request.route_url(
            'contextual_'+route_name, discussion_slug=discussion_slug, **args)


@view_config(
    route_name='logout', request_method='GET',
    renderer='assembl:templates/login.jinja2',
)
@view_config(
    route_name='contextual_logout', request_method='GET',
    renderer='assembl:templates/login.jinja2',
)
def logout(request):
    forget(request)
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
        raise HTTPFound("https://" + request.host + request.path_qs)
    return get_login_context(
        request, request.matched_route.name == 'login_forceproviders')


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
    logged_in = authenticated_userid(request)
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
    return render_to_response(
        'assembl:templates/profile.jinja2',
        dict(get_default_context(request),
             error='<br />'.join(errors),
             unverified_emails=unverified_emails,
             providers=get_providers_with_names(),
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
    p_slug = "/" + slug if slug else ""
    next_view = handle_next_view(request)
    if not request.params.get('email'):
        if request.scheme == "http"\
                and asbool(config.get("accept_secure_connection")):
            raise HTTPFound("https://" + request.host + request.path_qs)
        response = dict(get_login_context(request),
                    slug_prefix=p_slug)
        if request.GET.get('error', None):
            response['error'] = request.GET['error']
        return response
    forget(request)
    session = AgentProfile.default_db
    localizer = request.localizer
    name = request.params.get('name', '').strip()
    if not name or len(name) < 3:
        return dict(get_default_context(request),
            slug_prefix=p_slug,
            error=localizer.translate(_(
                "Please use a name of at least 3 characters")))
    password = request.params.get('password', '').strip()
    password2 = request.params.get('password2', '').strip()
    email = request.params.get('email', '').strip()
    if not is_email(email):
        return dict(get_default_context(request),
                    slug_prefix=p_slug,
                    error=localizer.translate(_(
                        "This is not a valid email")))
    email = EmailString.normalize_email_case(email)
    # Find agent account to avoid duplicates!
    if session.query(AbstractAgentAccount).filter_by(
            email_ci=email, verified=True).count():
        return dict(get_default_context(request),
                    slug_prefix=p_slug,
                    error=localizer.translate(_(
                        "We already have a user with this email.")))
    if password != password2:
        return dict(get_default_context(request),
                    slug_prefix=p_slug,
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
                'user_confirm_email', ticket=email_token(email_account))
        headers = remember(request, user.id)
        user.last_login = datetime.utcnow()
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
        return JSONError(400, message)
    referrer = request.environ['HTTP_REFERER']
    if '?' in referrer:
        referrer = referrer.split('?')[0]
    referrer += '?error='+quote(message)
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
    renderer='assembl:templates/login.jinja2'
)
@view_config(
    route_name='contextual_login',
    request_method='POST',
    permission=NO_PERMISSION_REQUIRED,
    renderer='assembl:templates/login.jinja2'
)
def assembl_login_complete_view(request):
    # Check if proper authorization. Otherwise send to another page.
    session = AgentProfile.default_db
    identifier = request.params.get('identifier', '').strip()
    password = request.params.get('password', '').strip()
    next_view = handle_next_view(
        request, True, 'register')
    logged_in = authenticated_userid(request)
    localizer = request.localizer
    user = None
    user, account = from_identifier(identifier)

    if not user:
        return dict(get_login_context(request),
                    error=localizer.translate(_("This user cannot be found")))
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
        user.login_failures += 1
        # TODO: handle high failure count
        session.add(user)
        return dict(get_login_context(request),
                    error=localizer.translate(_("Invalid user and password")))
    user.last_login = datetime.utcnow()
    headers = remember(request, user.id)
    request.response.headerlist.extend(headers)
    discussion = discussion_from_request(request)
    if discussion:
        maybe_auto_subscribe(user, discussion)
    return HTTPFound(location=next_view)


@view_config(route_name="contextual_social_auth", request_method=('GET', 'POST'))
@psa('social.complete')
def auth(request):
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
    slug = request.matchdict.get('discussion_slug', None)
    slug_prefix = "/" + slug if slug else ""
    if email.verified:
        # Your email is fine, why do you want to confirm it?
        # Temporary: explain, but it's a dead-end.
        # TODO: Unlog and redirect to login.
        return dict(
            get_default_context(request),
            slug_prefix=slug_prefix,
            profile_id=email.profile_id,
            action = "%s/confirm_email_sent_id/%d" % (slug_prefix, id),
            email_account_id=str(id),
            title=localizer.translate(_('This email address is already confirmed')),
            description=localizer.translate(_(
                'You do not need to confirm this email address, it is already confirmed.')))
    send_confirmation_email(request, email)
    return dict(
        get_default_context(request),
        action = "%s/confirm_email_sent_id/%d" % (slug_prefix, id),
        slug_prefix=slug_prefix,
        profile_id=email.profile_id,
        email_account_id=request.matchdict.get('email_account_id'),
        title=localizer.translate(_('Confirmation requested')),
        description=localizer.translate(_(
            'A confirmation e-mail has been sent to your account and should be in your inbox in a few minutes. '
            'Please follow the confirmation link in order to confirm your email')))


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
    token = request.matchdict.get('ticket')
    account, validity = verify_email_token(token)
    session = AbstractAgentAccount.default_db
    logged_in = authenticated_userid(request)  # if mismatch?
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
    if account.verified and logged_in:
        # no need to revalidate, just send to discussion.
        # Question: maybe_auto_subscribe? Doubt it.
        return HTTPFound(location=request.route_url(
            'home' if inferred_discussion else 'discussion_list',
            discussion_slug=inferred_discussion.slug,
            _query=dict(message=localizer.translate(
                _("Email <%s> already confirmed")) % (account.email,))))

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
            return HTTPFound(location=maybe_contextual_route(
                request, 'confirm_emailid_sent', email_account_id=account.id,
                _query=(dict(error=error))))
        else:
            if account and account.verified:
                # bad token, verified account... send them to login
                error = localizer.translate(
                    _("Email <%s> already confirmed")) % (account.email,)
            else:
                # now what? We do not have the email.
                # Just send to login for now
                error = localizer.translate(_(
                    "This link is not valid. Please attempt to login to get another one."
                    )) % (account.email,)
            return HTTPFound(location=maybe_contextual_route(
                request, 'login', _query=dict(
                    identifier=account.email if account else None,
                    message=error)))

    # By now we know we have a good token; make it login-equivalent.
    user = account.profile
    assert isinstance(user, User)  # accounts should not get here. OK to fail.
    headers = remember(request, user.id)
    request.response.headerlist.extend(headers)
    user.last_login = datetime.utcnow()
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
        return HTTPFound(location=request.route_url(
            'home', discussion_slug=inferred_discussion.slug,
            _query=dict(message=message)))
    else:
        return HTTPFound(
            location=request.route_url('discussion_list'))


@view_config(
    context=AuthException,  # maybe more specific?
    renderer='assembl:templates/login.jinja2',
)
def login_denied_view(request):
    localizer = request.localizer
    return dict(get_login_context(request),
                error=localizer.translate(_('Login failed, try again')))
    # TODO: If logged in otherwise, go to profile page.
    # Otherwise, back to login page


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
            slug = request.matchdict.get('discussion_slug', None)
            slug_prefix = "/" + slug if slug else ""
            return dict(
                get_default_context(request),
                action = "%s/confirm_email_sent/%s" % (slug_prefix, email),
                email=email,
                title=localizer.translate(_('Confirmation requested')),
                description=localizer.translate(_(
                    'A confirmation e-mail has been sent to your account and should be in your inbox in a few minutes. '
                    'Please follow the confirmation link in order to confirm your email')))
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
        slug = request.matchdict.get('discussion_slug', None)

        return dict(
            get_default_context(request),
            error=error,
            user_id=user_id,
            identifier=identifier,
            slug_prefix="/" + slug if slug else "",
            title=localizer.translate(_('I forgot my password')))

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
    slug = request.matchdict.get('discussion_slug', None)
    slug_prefix = "/" + slug if slug else ""
    profile_id=int(request.matchdict.get('profile_id'))
    return dict(
        get_default_context(request),
        profile_id=profile_id,
        slug_prefix=slug_prefix,
        action = "%s/password_change_sent/%d" % (slug_prefix, profile_id),
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
    renderer='assembl:templates/do_password_change.jinja2',
    permission=NO_PERMISSION_REQUIRED
)
@view_config(
    route_name='do_password_change', request_method="GET",
    renderer='assembl:templates/do_password_change.jinja2',
    permission=NO_PERMISSION_REQUIRED
)
@view_config(
    route_name='contextual_do_password_change', request_method="GET",
    renderer='assembl:templates/do_password_change.jinja2',
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
    token = request.matchdict.get('ticket')
    user, validity = verify_password_change_token(token)
    logged_in = authenticated_userid(request)
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

        return HTTPFound(location=maybe_contextual_route(
            request, 'request_password_change', _query=dict(
                user_id=user.id if user else '',
                error=error)))

    # V+: Valid token (encompasses P-B+, W-, B-L+); ALSO V-L+
    # V+P-B- should not happen, but we'll treat it the same.
    # go through password change dialog. We'll complete login afterwards.
    slug = discussion.slug if discussion else ""
    slug_prefix = "/" + slug if slug else ""
    if welcome:
        if discussion:
            discussion_topic = discussion.topic
            welcome_text = localizer.translate(_(
                "You will enter the discussion as <b>{name}</b>.")).format(name=user.name)
        else:
            discussion_topic = "Assembl"
            welcome_text = localizer.translate(_(
                "You will enter Assembl as <b>{name}</b>."))
        welcome_text += "</p><p>" + localizer.translate(_(
            "Please choose your password for security reasons."))
        title = localizer.translate(_('Welcome to {discussion_topic}.')).format(
            discussion_topic=discussion_topic)
    else:
        title = localizer.translate(_('Change your password'))
        welcome_text = ""
    return dict(
        get_default_context(request),
        slug_prefix=slug_prefix,
        description=welcome_text,
        token=token,
        title=title)


@view_config(
    route_name='finish_password_change', request_method="POST",
    renderer='assembl:templates/do_password_change.jinja2',
    permission=NO_PERMISSION_REQUIRED
)
@view_config(
    route_name='contextual_finish_password_change', request_method="POST",
    renderer='assembl:templates/do_password_change.jinja2',
    permission=NO_PERMISSION_REQUIRED
)
def finish_password_change(request):
    localizer = request.localizer
    token = request.params.get('token')
    title = request.params.get('title')
    user, validity = verify_password_change_token(token)
    logged_in = authenticated_userid(request)  # if mismatch?
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

        return HTTPFound(location=maybe_contextual_route(
            request, 'request_password_change', _query=dict(
                user_id=user.id if user else '',
                error=error)))

    discussion_slug = request.matchdict.get('discussion_slug', None)
    error = None
    p1, p2 = (request.params.get('password1', '').strip(),
              request.params.get('password2', '').strip())
    if p1 != p2:
        error = localizer.translate(_('The passwords are not identical'))
    elif p1:
        user.password_p = p1
        user.last_login = datetime.utcnow()
        headers = remember(request, user.id)
        request.response.headerlist.extend(headers)
        if discussion_slug:
            discussion = discussion_from_request(request)
            maybe_auto_subscribe(user, discussion)
        return HTTPFound(location=request.route_url(
            'home' if discussion_slug else 'discussion_list',
            discussion_slug=discussion_slug,
            _query=dict(
                message=localizer.translate(_(
                    "Password changed")))))

    slug_prefix = "/" + discussion_slug if discussion_slug else ""
    return dict(
        get_default_context(request),
        title=title, slug_prefix=slug_prefix, token=token, error=error)


def send_confirmation_email(request, email):
    mailer = get_mailer(request)
    localizer = request.localizer
    confirm_what = localizer.translate(_('email'))
    subject = localizer.translate(_("Please confirm your {confirm_what} with {assembl}"))
    if isinstance(email.profile, User) and not email.profile.verified:
        confirm_what = localizer.translate(_('account'))
        text_message = localizer.translate(_(u"""Hello, {name}, and welcome to {assembl}!

Please confirm your email address &lt;{email}&gt; and complete your registration by clicking the link below.
<{confirm_url}>

Best regards,
The {assembl} Team"""))
        html_message = localizer.translate(_(u"""<p>Hello, {name}, and welcome to {assembl}!</p>
<p>Please <a href="{confirm_url}">click here to confirm your email address</a>
&lt;{email}&gt; and complete your registration.</p>
<p>Best regards,<br />The {assembl} Team</p>"""))
    else:
        text_message = localizer.translate(_(u"""Hello, {name}!

Please confirm your new email address <{email}> on your {assembl} account by clicking the link below.
<{confirm_url}>

Best regards,
The {assembl} Team"""))
        html_message = localizer.translate(_(u"""<p>Hello, {name}!</p>
<p>Please <a href="{confirm_url}">click here to confirm your new email address</a>
&lt;{email}&gt; on your {assembl} account.</p>
<p>Best regards,<br />The {assembl} Team</p>"""))

    from assembl.auth.password import email_token
    data = dict(
        name=email.profile.name,
        email=email.email,
        assembl="Assembl",
        confirm_what=confirm_what,
        confirm_url=maybe_contextual_route(
            request, 'user_confirm_email',
            ticket=email_token(email))
    )
    message = Message(
        subject=subject.format(**data),
        sender=config.get('assembl.admin_email'),
        recipients=["%s <%s>" % (email.profile.name, email.email)],
        body=text_message.format(**data),
        html=html_message.format(**data))
    mailer.send(message)


def send_change_password_email(
        request, profile, email=None, subject=None,
        text_body=None, html_body=None, discussion=None,
        sender_name=None, welcome=False):
    mailer = get_mailer(request)
    localizer = request.localizer
    data = dict(
        assembl="Assembl", name=profile.name,
        confirm_url=maybe_contextual_route(
            request,
            'welcome' if welcome else 'do_password_change',
            ticket=password_change_token(profile)))
    sender_email = config.get('assembl.admin_email')
    if discussion:
        data.update(dict(
            discussion_topic=discussion.topic,
            discussion_url=discussion.get_url()))
        sender_name = sender_name or discussion.topic
    if sender_name:
        sender_name = UnicodeDammit(sender_name).unicode_markup
        # sanitize
        sender_name = re.sub(
            ur"[^-\w\s'\u2019\u2032\u00b4\.\(\)]", '', sender_name, 0, re.UNICODE)
        sender_name = Header(sender_name, 'utf-8').encode()
        sender = '"%s" <%s>' % (sender_name, sender_email)
        if len(sender) > 255:
            sender = sender_email
    else:
        sender = sender_email
    subject = (subject or localizer.translate(
        _("Request for password change"))).format(**data)
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
    mailer.send(message)
