from datetime import datetime
import simplejson as json
from urllib import quote
from smtplib import SMTPRecipientsRefused

from pyramid.i18n import TranslationStringFactory
from pyramid.view import view_config
from pyramid_mailer import get_mailer
from pyramid_mailer.message import Message
from pyramid.renderers import render_to_response
from pyramid.security import (
    remember,
    forget,
    authenticated_userid,
    NO_PERMISSION_REQUIRED)
from pyramid.httpexceptions import (
    HTTPUnauthorized,
    HTTPFound,
    HTTPNotFound,
    HTTPBadRequest,
    HTTPServerError)
from pyramid.settings import asbool
from sqlalchemy import desc
from velruse import login_url
from pyisemail import is_email

from assembl.models import (
    EmailAccount, IdentityProvider, IdentityProviderAccount,
    AgentProfile, User, Username, Role, LocalUserRole,
    AbstractAgentAccount, Discussion, AgentStatusInDiscussion)
from assembl.auth import (
    P_READ, R_PARTICIPANT)
from assembl.auth.password import (
    verify_email_token, verify_password_change_token,
    password_token)
from assembl.auth.util import (
    get_identity_provider, discussion_from_request)
from ...lib import config
from .. import get_default_context, JSONError

_ = TranslationStringFactory('assembl')


def get_login_context(request):
    slug = request.matchdict.get('discussion_slug', None)
    if slug:
        p_slug = "/" + slug
        request.session['discussion'] = slug
    else:
        p_slug = ""
        request.session.pop('discussion')
    return dict(get_default_context(request), **{
        'login_url': login_url,
        'slug_prefix': p_slug,
        'providers': request.registry.settings['login_providers'],
        'google_consumer_key': request.registry.settings.get(
            'google.consumer_key', ''),
        'next_view': handle_next_view(request)
    })


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
    next_view = request.params.get('next_view', None)\
        or request.session.get('next_view', None) or default
    discussion_slug = request.session.get('discussion', None)
    if discussion_slug:
        p_slug = '/' + discussion_slug
        if not next_view.startswith(p_slug):
            # Maybe the route already has a different slug...
            route, match = _get_route_from_path(request, next_view)
            if 'discussion_slug' not in match:
                next_view = p_slug + next_view
    if consume and 'next_view' in request.session:
        request.session.pop('next_view')
        request.session.pop('discussion')
    elif not consume and 'next_view' not in request.session:
        request.session["next_view"] = next_view
    return next_view


def maybe_contextual_route(request, route_name, **args):
    discussion_slug = request.matchdict.get('discussion_slug', None)
    if discussion_slug is None:
        return request.route_url(route_name, **args)
    else:
        return request.route_url(
            'contextual_'+route_name, discussion_slug=discussion_slug, **args)


@view_config(
    route_name='logout',
    renderer='assembl:templates/login.jinja2',
)
@view_config(
    route_name='contextual_logout',
    renderer='assembl:templates/login.jinja2',
)
def logout(request):
    forget(request)
    next_view = handle_next_view(request)
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
def login_view(request):
    return get_login_context(request)


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
            email=identifier).order_by(desc(
                AbstractAgentAccount.verified)).first()
        if not account:
            raise HTTPNotFound()
        profile = account.profile
    else:
        account = session.query(IdentityProviderAccount).join(
            IdentityProvider).filter(
                IdentityProviderAccount.username == identifier and
                IdentityProvider.type == id_type).first()
        if not account:
            raise HTTPNotFound()
        profile = account.profile
    return profile


@view_config(route_name='profile_user')
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
        return HTTPFound(location=request.route_url(
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
            email=ea.email, verified=True).first())
        for ea in profile.email_accounts if not ea.verified]
    return render_to_response(
        'assembl:templates/profile.jinja2',
        dict(get_default_context(request),
             error='<br />'.join(errors),
             unverified_emails=unverified_emails,
             providers=request.registry.settings['login_providers'],
             google_consumer_key=request.registry.settings.get(
                 'google.consumer_key', ''),
             the_user=profile,
             user=session.query(User).get(logged_in)))


@view_config(route_name='avatar')
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
    route_name='register',
    permission=NO_PERMISSION_REQUIRED,
    renderer='assembl:templates/register.jinja2'
)
@view_config(
    route_name='contextual_register',
    permission=NO_PERMISSION_REQUIRED,
    renderer='assembl:templates/register.jinja2'
)
def assembl_register_view(request):
    slug = request.matchdict.get('discussion_slug', "")
    p_slug = "/" + slug if slug else ""
    next_view = handle_next_view(request)
    if not request.params.get('email'):
        response = dict(get_default_context(request),
                    slug_prefix=p_slug)
        if request.GET.get('error', None):
            response['error'] = request.GET['error']
        return response
    forget(request)
    session = AgentProfile.default_db
    localizer = request.localizer
    name = request.params.get('name', '').strip()
    password = request.params.get('password', '').strip()
    password2 = request.params.get('password2', '').strip()
    email = request.params.get('email', '').strip()
    if not is_email(email):
        return dict(get_default_context(request),
                    slug_prefix=p_slug,
                    error=localizer.translate(_(
                        "This is not a valid email")))
    # Find agent account to avoid duplicates!
    if session.query(AbstractAgentAccount).filter_by(
            email=email, verified=True).count():
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
        now = datetime.utcnow()
        agent_status = AgentStatusInDiscussion(
            agent_profile=user, discussion=discussion,
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
        request.response.headerlist.extend(headers)
        # TODO: Tell them to expect an email.
        request.session.pop('next_view')
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
        account = session.query(AbstractAgentAccount).filter_by(
            email=identifier).order_by(AbstractAgentAccount.verified.desc()).first()
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
        request.session['next_view'] = next_view
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
    headers = remember(request, user.id)
    request.response.headerlist.extend(headers)
    discussion = discussion_from_request(request)
    return HTTPFound(location=next_view)


@view_config(
    context='velruse.AuthenticationComplete'
)
def velruse_login_complete_view(request):
    session = AgentProfile.default_db
    context = request.context
    velruse_profile = context.profile
    discussion = None
    slug = request.session.get('discussion', None)
    if not slug:
        discussion = discussion_from_request(request)
        if discussion:
            slug = discussion.slug
    if slug and not discussion:
        discussion = session.query(Discussion).filter_by(
            slug=slug).first()
    next_view = handle_next_view(request, True)
    logged_in = authenticated_userid(request)
    provider = get_identity_provider(request)
    # find or create IDP_Accounts
    idp_accounts = []
    new_idp_accounts = []
    velruse_accounts = velruse_profile['accounts']
    old_autoflush = session.autoflush
    # sqla mislikes creating accounts before profiles, so delay
    session.autoflush = False
    for velruse_account in velruse_accounts:
        if 'userid' in velruse_account:
            idp_accounts.extend(session.query(
                IdentityProviderAccount).filter_by(
                    provider=provider,
                    domain=velruse_account['domain'],
                    userid=velruse_account['userid']).all())
        elif 'username' in velruse_account:
            idp_accounts.extend(session.query(
                IdentityProviderAccount).filter_by(
                    provider=provider,
                    domain=velruse_account['domain'],
                    username=velruse_account['username']).all())
        else:
            raise HTTPServerError()
    if idp_accounts:
        for idp_account in idp_accounts:
            idp_account.profile_info_json = velruse_profile
    else:
        idp_account = IdentityProviderAccount(
            provider=provider,
            profile_info_json=velruse_profile,
            domain=velruse_account.get('domain'),
            userid=velruse_account.get('userid'),
            username=velruse_account.get('username'))
        idp_accounts.append(idp_account)
        new_idp_accounts.append(idp_account)
        session.add(idp_account)
    # find AgentProfile
    profile = None
    user = None
    profiles = [a.profile for a in idp_accounts if a.profile]
    # Maybe we already have a profile based on email
    if idp_account.email and idp_account.verified:
        email = idp_account.email
        other_account = session.query(AbstractAgentAccount).filter_by(
            email=email, verified=True).first()
        if other_account and other_account.profile \
                and other_account.profile not in profiles:
            profiles.append(other_account.profile)
    profiles = list(set(profiles))
    # prefer profiles with verified users, then users, then oldest profiles
    profiles.sort(key=lambda p: (
        not(isinstance(p, User) and p.verified),
        not isinstance(p, User), p.id))
    if logged_in:
        # NOTE: Must make sure that login page not available when
        # logged in as another account.
        user = session.query(User).filter_by(id=logged_in).first()
        if user:
            if user in profiles:
                profiles.remove(user)
            profiles.insert(0, user)
    username = None
    if len(profiles):
        # first is presumably best
        profile = profiles.pop(0)
        while len(profiles):
            other = profiles.pop()
            # Multiple profiles. We need to combine them to one.
            profile.merge(other)
            session.delete(other)
        if isinstance(profile, User):
            if profile.username:
                username = profile.username.username
            profile.last_login = datetime.utcnow()
            if not profile.name:
                profile.name = velruse_profile.get('displayName', None)
    else:
        # Create a new user
        profile = User(
            name=velruse_profile.get('displayName', ''),
            verified=True,
            last_login=datetime.utcnow(),
            creation_date=datetime.utcnow(),
            #timezone=velruse_profile['utcOffset'],   # TODO: needs parsing
        )

        session.add(profile)
        usernames = set((a['preferredUsername'] for a in velruse_accounts
                         if 'preferredUsername' in a))
        for u in usernames:
            if not session.query(Username).filter_by(username=u).count():
                username = u
                break
        if username:
            session.add(Username(username=username, user=profile))
        if discussion:
            now = datetime.utcnow()
            agent_status = AgentStatusInDiscussion(
                agent_profile=profile, discussion=discussion,
                user_created_on_this_discussion=True)
            session.add(agent_status)
        session.flush()
        if maybe_auto_subscribe(profile, discussion):
            next_view = "/%s/" % (slug,)
    for idp_account in new_idp_accounts:
        idp_account.profile = profile
    # Now all accounts have a profile
    session.autoflush = old_autoflush
    email_accounts = {ea.email: ea for ea in profile.email_accounts}
    # There may be new emails in the accounts
    verified_email = None
    if 'verifiedEmail' in velruse_profile:
        verified_email = velruse_profile['verifiedEmail']
        if verified_email in email_accounts and provider.trust_emails:
            email_account = email_accounts[verified_email]
            if email_account.preferred:
                idp_account.preferred = True
            email_account.delete()
    for email_d in velruse_profile.get('emails', []):
        if isinstance(email_d, dict):
            email = email_d['value']
            if verified_email != email:
                # create an unverified email account.
                email = EmailAccount(
                    email=email,
                    profile=profile
                )
                session.add(email)
            else:
                if email_d.get('preferred', False):
                    # maybe TODO: make the idp_account preferred,
                    # if no other account is preferred?
                    pass

    # Note that if an IdP account stops claiming an email, it "leaks".
    session.flush()

    user_id = profile.id
    headers = remember(request, user_id)
    request.response.headerlist.extend(headers)
    # TODO: Store the OAuth etc. credentials.
    # Though that may be done by velruse?
    return HTTPFound(location=next_view)


@view_config(
    route_name='confirm_emailid_sent',
    renderer='assembl:templates/confirm.jinja2',
    permission=NO_PERMISSION_REQUIRED
)
@view_config(
    route_name='contextual_confirm_emailid_sent',
    renderer='assembl:templates/confirm.jinja2',
    permission=NO_PERMISSION_REQUIRED
)
def confirm_emailid_sent(request):
    # TODO: How to make this not become a spambot?
    id = int(request.matchdict.get('email_account_id'))
    email = AbstractAgentAccount.get(id)
    if not email:
        raise HTTPNotFound()
    if email.verified:
        # TODO!: Your email is fine, why do you want to confirm it?
        # Unlog and redirect to login.
        pass
    send_confirmation_email(request, email)
    localizer = request.localizer
    slug = request.matchdict.get('discussion_slug', None)
    slug_prefix = "/" + slug if slug else ""
    return dict(
        get_default_context(request),
        slug_prefix=slug_prefix,
        profile_id=email.profile_id,
        email_account_id=request.matchdict.get('email_account_id'),
        title=localizer.translate(_('Confirmation requested')),
        description=localizer.translate(_(
            'A confirmation e-mail has been sent to your account and should be in your inbox in a few minutes. '
            'Please follow the confirmation link in order to confirm your email')))


def maybe_auto_subscribe(user, discussion):
    if (not discussion
            or not discussion.subscribe_to_notifications_on_signup):
        return False
    # really auto-subscribe user
    role = discussion.db.query(Role).filter_by(name=R_PARTICIPANT).first()
    discussion.db.add(LocalUserRole(
        user_id=user.id, role=role,
        discussion_id=discussion.id))
    discussion.db.flush()
    # apply new notifications
    user.get_notification_subscriptions(discussion.id)
    return True


@view_config(
    route_name='user_confirm_email',
    renderer='assembl:templates/email_confirmed.jinja2',
    permission=NO_PERMISSION_REQUIRED
)
@view_config(
    route_name='contextual_user_confirm_email',
    renderer='assembl:templates/email_confirmed.jinja2',
    permission=NO_PERMISSION_REQUIRED
)
def user_confirm_email(request):
    token = request.matchdict.get('ticket')
    email = verify_email_token(token)
    session = AbstractAgentAccount.default_db
    # TODO: token expiry
    localizer = request.localizer
    if not email:
        raise HTTPUnauthorized(localizer.translate(_("Wrong email token.")))
    assert isinstance(email.profile, User)
    user = email.profile
    username = user.username.username if user.username else None
    userid = user.id
    slug = request.matchdict.get('discussion_slug', None)
    if not slug:
        # We do not know from which discussion the user started to log in;
        # See if only involved in one discussion
        discussions = user.involved_in_discussion
        if len(discussions) == 1:
            slug = discussions[0].slug
    next_view = handle_next_view(request, False)

    if email.verified:
        return HTTPFound(location=maybe_contextual_route(
            request, 'login', _query=dict(message=localizer.translate(
                _("Email <%s> already confirmed")) % (email.email,))))
    else:
        # maybe another profile already verified that email
        other_email_account = session.query(AbstractAgentAccount).filter_by(
            email=email.email, verified=True).first()
        if other_email_account:
            profile = email.profile
            # We have two versions of the email, delete the unverified one
            session.delete(email)
            if other_email_account.profile != email.profile:
                # Give priority to the one where the email was verified last.
                other_profile = other_email_account.profile
                profile.merge(other_profile)
                session.delete(other_profile)
            email = other_email_account
        email.verified = True
        email.profile.verified = True
        user = None
        username = None
        userid = None
        if isinstance(email.profile, User):
            user = email.profile
            if user.username:
                username = user.username.username
            userid = user.id
        if user:
            # if option is active in discussion, auto-subscribe
            # user to discussion's default notifications
            discussion = None
            if slug:
                discussion = session.query(Discussion).filter_by(
                    slug=slug).first()
            if maybe_auto_subscribe(user, discussion):
                custom_message = localizer.translate(_(
                    "Your email address %s has been confirmed, "
                    "and you are now subscribed to discussion's "
                    "default notifications.")) % (email.email,)
            else:
                custom_message = localizer.translate(_(
                    "Your email address %s has been confirmed,"
                    " you can now log in.")) % (email.email,)
            return dict(
                get_default_context(request),
                button_url=maybe_contextual_route(request, 'login'),
                button_label=localizer.translate(_('Log in')),
                title=localizer.translate(_('Your account is now active!')),
                description=custom_message)
        else:
            # we confirmed a profile without a user? Now what?
            raise HTTPServerError()


@view_config(
    context='velruse.AuthenticationDenied',
    renderer='assembl:templates/login.jinja2',
)
def login_denied_view(request):
    localizer = request.localizer
    return dict(get_login_context(request),
                error=localizer.translate(_('Login failed, try again')))
    # TODO: If logged in otherwise, go to profile page.
    # Otherwise, back to login page


@view_config(
    route_name='confirm_email_sent',
    renderer='assembl:templates/confirm.jinja2',
    permission=NO_PERMISSION_REQUIRED
)
@view_config(
    route_name='contextual_confirm_email_sent',
    renderer='assembl:templates/confirm.jinja2',
    permission=NO_PERMISSION_REQUIRED
)
def confirm_email_sent(request):
    localizer = request.localizer
    # TODO: How to make this not become a spambot?
    email = request.matchdict.get('email')
    if not email:
        raise HTTPNotFound()
    email_objects = AbstractAgentAccount.default_db.query(
        AbstractAgentAccount).filter_by(email=email)
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
        else:
            # TODO!: Your email is fine, why do you want to confirm it?
            # Unlog and redirect to login.
            pass
    else:
        if len(unverified_emails):
            # Normal case: Send an email. May be spamming
            for email_account in unverified_emails:
                send_confirmation_email(request, email_account)
            return dict(
                get_default_context(request),
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
    route_name='request_password_change',
    renderer='assembl:templates/request_password_change.jinja2',
    permission=NO_PERMISSION_REQUIRED
)
@view_config(
    route_name='contextual_request_password_change',
    renderer='assembl:templates/request_password_change.jinja2',
    permission=NO_PERMISSION_REQUIRED
)
def request_password_change(request):
    localizer = request.localizer
    identifier = request.params.get('identifier', '')
    if not identifier:
        return dict(get_default_context(request),
            title=localizer.translate(_('I forgot my password')))
    user, account = from_identifier(identifier)
    discussion_slug = request.matchdict.get('discussion_slug', None)
    route = 'password_change_sent'
    if discussion_slug:
        route = 'contextual_' + route

    if not user:
        return dict(get_default_context(request),
                    identifier=identifier,
                    error=localizer.translate(_("This user cannot be found")),
                    title=localizer.translate(_('I forgot my password')))
    return HTTPFound(location=maybe_contextual_route(
        request, 'password_change_sent', profile_id=user.id,
        _query=dict(email=identifier if '@' in identifier else '')))


@view_config(
    route_name='password_change_sent',
    renderer='assembl:templates/confirm.jinja2',
    permission=NO_PERMISSION_REQUIRED
)
@view_config(
    route_name='contextual_password_change_sent',
    renderer='assembl:templates/confirm.jinja2',
    permission=NO_PERMISSION_REQUIRED
)
def password_change_sent(request):
    localizer = request.localizer
    if not request.params.get('sent', False):
        profile_id = int(request.matchdict.get('profile_id'))
        profile = AgentProfile.get(profile_id)
        if not profile:
            raise HTTPNotFound("No profile "+profile_id)
        send_change_password_email(
            request, profile,
            request.params.get('email', None))
    slug = request.matchdict.get('discussion_slug', None)
    slug_prefix = "/" + slug if slug else ""
    return dict(
        get_default_context(request),
        profile_id=int(request.matchdict.get('profile_id')),
        slug_prefix=slug_prefix,
        error=request.params.get('error'),
        title=localizer.translate(_('Password change requested')),
        description=localizer.translate(_(
            'We have sent you an email with a temporary connection link. '
            'Please use that link to log in and change your password.')))


@view_config(
    route_name='do_password_change',
    renderer='assembl:templates/do_password_change.jinja2',
    permission=NO_PERMISSION_REQUIRED
)
@view_config(
    route_name='contextual_do_password_change',
    renderer='assembl:templates/do_password_change.jinja2',
    permission=NO_PERMISSION_REQUIRED
)
def do_password_change(request):
    localizer = request.localizer
    token = request.matchdict.get('ticket')
    (verified, user_id) = verify_password_change_token(token, 24)

    if not verified:
        if not user_id:
            raise HTTPBadRequest(localizer.translate(_(
                "Wrong password token.")))
        else:
            return HTTPFound(location=maybe_contextual_route(
                request, 'password_change_sent', profile_id=user_id, _query=dict(
                    sent=True, error=localizer.translate(_(
                        "This token is expired. "
                        "Do you want us to send another?")))))
    user = User.get(user_id)
    headers = remember(request, user_id)
    request.response.headerlist.extend(headers)
    user.last_login = datetime.utcnow()
    slug = request.matchdict.get('discussion_slug', None)
    slug_prefix = "/" + slug if slug else ""
    return dict(
        get_default_context(request),
        slug_prefix=slug_prefix,
        title=localizer.translate(_('Change your password')))


@view_config(
    route_name='finish_password_change',
    renderer='assembl:templates/do_password_change.jinja2',
    permission=P_READ
)
@view_config(
    route_name='contextual_finish_password_change',
    renderer='assembl:templates/do_password_change.jinja2',
    permission=P_READ
)
def finish_password_change(request):
    logged_in = authenticated_userid(request)
    if not logged_in:
        raise HTTPUnauthorized()
    user = User.get(logged_in)
    localizer = request.localizer
    discussion_slug = request.matchdict.get('discussion_slug', None)
    error = None
    p1, p2 = (request.params.get('password1', '').strip(),
              request.params.get('password2', '').strip())
    if p1 != p2:
        error = localizer.translate(_('The passwords are not identical'))
    elif p1:
        user.password_p = p1
        return HTTPFound(location=request.route_url(
            'home' if discussion_slug else 'discussion_list',
            discussion_slug=discussion_slug,
            _query=dict(
                message=localizer.translate(_(
                    "Password changed")))))

    slug_prefix = "/" + discussion_slug if discussion_slug else ""
    return dict(
        get_default_context(request),
        slug_prefix=slug_prefix, error=error)


def send_confirmation_email(request, email):
    mailer = get_mailer(request)
    localizer = request.localizer
    confirm_what = _('email')
    if isinstance(email.profile, User) and not email.profile.verified:
        confirm_what = _('account')
        text_message = _(u"""Hello, ${name}, and welcome to ${assembl}!

Please confirm your email address &lt;${email}&gt; and complete your registration by clicking the link below.
<${confirm_url}>

Best regards,
The ${assembl} Team""")
        html_message = _(u"""<p>Hello, ${name}, and welcome to ${assembl}!</p>
<p>Please <a href="${confirm_url}">click here to confirm your email address</a>
&lt;${email}&gt; and complete your registration.</p>
<p>Best regards,<br />The ${assembl} Team</p>""")
    else:
        text_message = _(u"""Hello, ${name}!

Please confirm your new email address <${email}> on your ${assembl} account by clicking the link below.
<${confirm_url}>

Best regards,
The ${assembl} Team""")
        html_message = _(u"""<p>Hello, ${name}!</p>
<p>Please <a href="${confirm_url}">click here to confirm your new email address</a>
&lt;${email}&gt; on your ${assembl} account.</p>
<p>Best regards,<br />The ${assembl} Team</p>""")

    from assembl.auth.password import email_token
    data = {
        'name': email.profile.name,
        'email': email.email,
        'assembl': "Assembl",
        'confirm_what': localizer.translate(confirm_what),
        'confirm_url': maybe_contextual_route(
            request, 'user_confirm_email',
            ticket=email_token(email))
    }
    message = Message(
        subject=localizer.translate(_("Please confirm your ${confirm_what} with ${assembl}"), mapping=data),
        sender=config.get('assembl.admin_email'),
        recipients=["%s <%s>" % (email.profile.name, email.email)],
        body=localizer.translate(_(text_message), mapping=data),
        html=localizer.translate(_(html_message), mapping=data))
    #if deferred:
    #    mailer.send_to_queue(message)
    #else:
    mailer.send(message)


def send_change_password_email(
        request, profile, email=None):
    mailer = get_mailer(request)
    localizer = request.localizer
    data = dict(
        name=profile.name, assembl="Assembl",
        confirm_url=maybe_contextual_route(
            request, 'do_password_change',
            ticket=password_token(profile)))
    message = Message(
        subject=localizer.translate(
            _("Request for password change"), mapping=data),
        sender=config.get('assembl.admin_email'),
        recipients=["%s <%s>" % (
            profile.name, email or profile.get_preferred_email())],
        body=localizer.translate(_(u"""Hello, ${name}!
We have received a request to change the password on your ${assembl} account.
To confirm your password change please click on the link below.
<${confirm_url}>

If you did not ask to reset your password please disregard this email.

Best regards,
The ${assembl} Team
"""), mapping=data),
        html=localizer.translate(_(u"""<p>Hello, ${name}!</p>
<p>We have received a request to change the password on your ${assembl} account.
Please <a href="${confirm_url}">click here to confirm your password change</a>.</p>
<p>If you did not ask to reset your password please disregard this email.</p>
<p>Best regards,<br />The ${assembl} Team</p>
"""), mapping=data))
    # if deferred:
    #    mailer.send_to_queue(message)
    # else:
    mailer.send(message)
