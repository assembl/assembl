from datetime import datetime
import simplejson as json

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
import transaction
from velruse import login_url
from pyisemail import is_email

from assembl.models import (
    EmailAccount, IdentityProvider, IdentityProviderAccount,
    AgentProfile, User, Username)
from assembl.auth import P_READ
from assembl.auth.password import (format_token, verify_email_token, 
    verify_password_change_token, password_token)
from assembl.auth.util import get_identity_provider
from ...lib import config
from .. import get_default_context

_ = TranslationStringFactory('assembl')


def get_login_context(request):
    return dict(get_default_context(request), **{
        'login_url': login_url,
        'providers': request.registry.settings['login_providers'],
        'google_consumer_key': request.registry.settings.get(
            'google.consumer_key', ''),
        'next_view': request.params.get('next_view', '/')
    })


@view_config(
    route_name='logout',
    renderer='assembl:templates/login.jinja2',
)
def logout(request):
    forget(request)
    next_view = request.params.get('next_view', '/')
    return HTTPFound(next_view)


@view_config(
    route_name='login',
    request_method='GET', http_cache=60,
    renderer='assembl:templates/login.jinja2',
)
#The following was executed when calls to the frontend api calls were
#made.  I don't know how to avoid this registration of the api paths.
#It returns a 200 status code which breaks the API
#@view_config(
#    renderer='assembl:templates/login.jinja2',
#    context='pyramid.exceptions.Forbidden',
#    permission=NO_PERMISSION_REQUIRED
#)
def login_view(request):
    # TODO: In case of forbidden, get the URL and pass it along.
    if request.params.get('next_view', None):
        request.session['next_view'] = request.params['next_view']
    localizer = request.localizer
    return get_login_context(request)


def get_profile(request):
    id_type = request.matchdict.get('type').strip()
    identifier = request.matchdict.get('identifier').strip()
    session = AgentProfile.db
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
        account = session.query(EmailAccount).filter_by(
            email=identifier).order_by(desc(EmailAccount.verified)).first()
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
    session = AgentProfile.db
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
        return HTTPFound(request.route_url(
            'confirm_emailid_sent', email_account_id=int(confirm_email)))

    errors = []
    if save:
        user_id = profile.id
        redirect = False
        username = request.params.get('username', '').strip()
        if username and (
                profile.username is None or username != profile.username.username):
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
            profile.set_password(p1)
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
        (ea, session.query(EmailAccount).filter_by(
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
def assembl_register_view(request):
    if request.params.get('next_view', None):
        request.session['next_view'] = request.params['next_view']
    if not request.params.get('email'):
        return dict(get_default_context(request),
                    next_view=request.params.get('next_view', '/'))
    forget(request)
    session = AgentProfile.db
    localizer = request.localizer
    name = request.params.get('name', '').strip()
    password = request.params.get('password', '').strip()
    password2 = request.params.get('password2', '').strip()
    email = request.params.get('email', '').strip()
    if not is_email(email):
        return dict(get_default_context(request),
                    error=localizer.translate(_(
                        "This is not a valid email")))
    # Find agent account to avoid duplicates!
    if session.query(EmailAccount).filter_by(
            email=email, verified=True).count():
        return dict(get_default_context(request),
                    error=localizer.translate(_(
                        "We already have a user with this email.")))
    if password != password2:
        return dict(get_default_context(request),
                    error=localizer.translate(_(
                        "The passwords should be identical")))

    #TODO: Validate password quality
    # otherwise create.
    validate_registration = asbool(config.get(
        'assembl.validate_registration_emails'))

    user = User(
        name=name,
        password=password,
        verified=not validate_registration,
        creation_date=datetime.now()
    )
    email_account = EmailAccount(
        email=email,
        verified=not validate_registration,
        profile=user
    )
    session.add(user)
    session.add(email_account)
    session.flush()
    if not validate_registration:
        if asbool(config.get('pyramid.debug_authorization')):
            # for debugging purposes
            from assembl.auth.password import email_token
            print "email token:", request.route_url(
                'user_confirm_email', ticket=email_token(email_account))
        headers = remember(request, user.id, tokens=format_token(user))
        request.response.headerlist.extend(headers)
        # TODO: Tell them to expect an email.
        next_view = request.session.pop('next_view') or \
            request.params.get('next_view', '/register')
        return HTTPFound(location=next_view)
    return HTTPFound(location=request.route_url(
        'confirm_emailid_sent', email_account_id=email_account.id))


def from_identifier(identifier):
    session = AgentProfile.db
    if '@' in identifier:
        account = session.query(EmailAccount).filter_by(
            email=identifier).order_by(EmailAccount.verified.desc()).first()
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
def assembl_login_complete_view(request):
    # Check if proper authorization. Otherwise send to another page.
    session = AgentProfile.db
    identifier = request.params.get('identifier', '').strip()
    password = request.params.get('password', '').strip()
    next_view = request.params.get('next_view') or \
        request.session.pop('next_view') or '/register'
    logged_in = authenticated_userid(request)
    localizer = request.localizer
    user = None
    user, account = from_identifier(identifier)

    if not user:
        request.session['next_view'] = next_view
        return dict(get_login_context(request),
                    error=localizer.translate(_("This user cannot be found")),
                    next_view=next_view)
    if account and not account.verified:
        return HTTPFound(location=request.route_url(
            'confirm_emailid_sent',
            email_account_id=account.id))
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
        #TODO: handle high failure count
        session.add(user)
        return dict(get_login_context(request),
                    error=localizer.translate(_("Invalid user and password")))
    headers = remember(request, user.id, tokens=format_token(user))
    request.response.headerlist.extend(headers)
    return HTTPFound(location=next_view)


@view_config(
    context='velruse.AuthenticationComplete'
)
def velruse_login_complete_view(request):
    session = AgentProfile.db
    context = request.context
    velruse_profile = context.profile
    next_view = request.session.pop('next_view') or '/'
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
        for account in idp_accounts:
            account.profile_info_json = velruse_profile
    else:
        idp_account = IdentityProviderAccount(
            provider=provider,
            profile_info=json.dumps(velruse_profile),
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
    if provider.trust_emails and 'verifiedEmail' in velruse_profile:
        email = velruse_profile['verifiedEmail']
        email_account = session.query(EmailAccount).filter_by(
            email=email, verified=True).first()
        if email_account and email_account.profile \
                and email_account.profile not in profiles:
            profiles.append(email_account.profile)
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
            profile.last_login = datetime.now()
            if not profile.name:
                profile.name = velruse_profile.get('displayName', None)
    else:
        # Create a new user
        profile = User(
            name=velruse_profile.get('displayName', ''),
            verified=True,
            last_login=datetime.now(),
            creation_date=datetime.now(),
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
    for idp_account in new_idp_accounts:
        idp_account.profile = profile
    # Now all accounts have a profile
    session.autoflush = old_autoflush
    email_accounts = {ea.email: ea for ea in profile.email_accounts}
    # There may be new emails in the accounts
    if 'verifiedEmail' in velruse_profile:
        email = velruse_profile['verifiedEmail']
        if email in email_accounts:
            email_account = email_accounts[email]
            if provider.trust_emails and not email_account.verified:
                email_account.verified = True
                session.add(email_account)
        else:
            email_account = EmailAccount(
                email=email,
                verified=provider.trust_emails,
                profile=profile
            )
            email_accounts[email] = email_account
            session.add(email_account)
    for email in velruse_profile.get('emails', []):
        preferred = False
        if isinstance(email, dict):
            preferred = email.get('preferred', False)
            email = email['value']
        if email not in email_accounts:
            email = EmailAccount(
                email=email,
                preferred=preferred,
                profile=profile
            )
            session.add(email)
    # Note that if an IdP account stops claiming an email, it "leaks".
    session.flush()

    user_id = profile.id
    headers = remember(request, user_id, tokens=format_token(profile))
    request.response.headerlist.extend(headers)
    # TODO: Store the OAuth etc. credentials.
    # Though that may be done by velruse?
    return HTTPFound(location=next_view)


@view_config(
    route_name='confirm_emailid_sent',
    renderer='assembl:templates/confirm.jinja2',
    permission=NO_PERMISSION_REQUIRED
)
def confirm_emailid_sent(request):
    # TODO: How to make this not become a spambot?
    id = int(request.matchdict.get('email_account_id'))
    email = EmailAccount.get(id)
    if not email:
        raise HTTPNotFound()
    if email.verified:
        # TODO!: Your email is fine, why do you want to confirm it?
        # Unlog and redirect to login.
        pass
    send_confirmation_email(request, email)
    localizer = request.localizer
    return dict(
        get_default_context(request),
        email_account_id=request.matchdict.get('email_account_id'),
        title=localizer.translate(_('Confirmation requested')),
        description=localizer.translate(_(
            'We have sent you a confirmation email. '
            'Please use the link to confirm your email to Assembl')))


@view_config(
    route_name='user_confirm_email',
    permission=NO_PERMISSION_REQUIRED
)
def user_confirm_email(request):
    token = request.matchdict.get('ticket')
    email = verify_email_token(token)
    session = EmailAccount.db
    # TODO: token expiry
    localizer = request.localizer
    if not email:
        raise HTTPUnauthorized(localizer.translate(_("Wrong email token.")))
    assert isinstance(email.profile, User)
    user = email.profile
    username = user.username.username if user.username else None
    userid = user.id
    # We do not know from which discussion the user started to log in...
    # We have to think about this. Maybe put in the token?
    # Send to login, then discussion if there happens to be only one.
    discussions = user.involved_in_discussion
    location = 'login'
    if len(discussions) == 1:
        location_params = dict(next_view='/'+discussions[0].slug)
    else:
        location_params = dict()

    if email.verified:
        raise HTTPFound(location=request.route_url(
            location, **dict(location_params,
            _query=dict(message=localizer.translate(_(
                "Email <%s> already confirmed")) % (email.email,)))))
    else:
        # maybe another profile already verified that email
        other_email_account = session.query(EmailAccount).filter_by(
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
        if username:
            return HTTPFound(location=request.route_url(
                location, **dict(location_params,
                _query=dict(message=localizer.translate(_(
                    "Email <%s> confirmed")) % (email.email,)))))
        elif userid:
            return HTTPFound(location=request.route_url(
                location, **dict(location_params,
                _query=dict(message=localizer.translate(_(
                    "Email <%s> confirmed")) % (email.email,)))))
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
def confirm_email_sent(request):
    localizer = request.localizer
    # TODO: How to make this not become a spambot?
    email = request.matchdict.get('email')
    if not email:
        raise HTTPNotFound()
    email_objects = EmailAccount.db.query(EmailAccount).filter_by(
        email=email)
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
                    'We have sent you a confirmation email. '
                    'Please use the link to confirm your email to Assembl')))
        else:
            # We do not have an email to this name.
            return HTTPFound(location=request.route_url(
                'register', email=email, _query=dict(
                    error=localizer.translate(_(
                        "We do not know about this email.")))))


@view_config(
    route_name='request_password_change',
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
    if not user:
        return dict(get_default_context(request),
                    identifier=identifier,
                    error=localizer.translate(_("This user cannot be found")),
                    title=localizer.translate(_('I forgot my password')))
    return HTTPFound(location=request.route_url(
        'password_change_sent', profile_id=user.id, _query=dict(
            email=identifier if '@' in identifier else '')))


@view_config(
    route_name='password_change_sent',
    renderer='assembl:templates/confirm.jinja2',
    permission=NO_PERMISSION_REQUIRED
)
def password_change_sent(request):
    localizer = request.localizer
    if not request.params.get('sent', False):
        profile_id = int(request.matchdict.get('profile_id'))
        send_change_password_email(
            request, AgentProfile.get(profile_id),
            request.params.get('email', None))
    return dict(
        get_default_context(request),
        profile_id=request.matchdict.get('profile_id'),
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
def do_password_change(request):
    localizer = request.localizer
    token = request.matchdict.get('ticket')
    (verified, user_id) = verify_password_change_token(token, 24)

    if not verified:
        if not user_id:
            raise HTTPBadRequest(localizer.translate(_(
                "Wrong password token.")))
        else:
            return HTTPFound(request.route_url(
                'password_change_sent', profile_id=user_id, _query=dict(
                    sent=True, error=localizer.translate(_(
                        "This token is expired. "
                        "Do you want us to send another?")))))
    user = User.get(user_id)
    headers = remember(request, user_id, tokens=format_token(user))
    request.response.headerlist.extend(headers)
    user.last_login = datetime.now()
    return dict(
        get_default_context(request),
        title=localizer.translate(_('Change your password')))


@view_config(
    route_name='finish_password_change',
    renderer='assembl:templates/do_password_change.jinja2',
    permission=P_READ
)
def finish_password_change(request):
    logged_in = authenticated_userid(request)
    if not logged_in:
        raise HTTPUnauthorized()
    user = User.get(logged_in)
    localizer = request.localizer
    error = None
    p1, p2 = (request.params.get('password1', '').strip(),
              request.params.get('password2', '').strip())
    if p1 != p2:
        error = localizer.translate(_('The passwords are not identical'))
    elif p1:
        user.set_password(p1)
        return HTTPFound(request.route_url(
            'discussion_list', _query=dict(
                message=localizer.translate(_(
                    "Password changed")))))

    return dict(get_default_context(request), error=error)


def send_confirmation_email(request, email):
    mailer = get_mailer(request)
    localizer = request.localizer
    confirm_what = _('email')
    if isinstance(email.profile, User) and not email.profile.verified:
        confirm_what = _('account')
    from assembl.auth.password import email_token
    data = {
        'name': email.profile.name,
        'email': email.email,
        'assembl': "Assembl",
        'confirm_what': localizer.translate(confirm_what),
        'confirm_url': request.route_url('user_confirm_email',
                                         ticket=email_token(email))
    }
    message = Message(
        subject=localizer.translate(_("Please confirm your ${confirm_what} with <${assembl}>"), mapping=data),
        sender=config.get('assembl.admin_email'),
        recipients=["%s <%s>" % (email.profile.name, email.email)],
        body=localizer.translate(_(u"""Hello, ${name}!
Please confirm your ${confirm_what} <${email}> with ${assembl} by clicking on the link below.
<${confirm_url}>
"""), mapping=data),
        html=localizer.translate(_(u"""<p>Hello, ${name}!</p>
<p>Please <a href="${confirm_url}">confirm your ${confirm_what}</a> &lt;${email}&gt; with <${assembl}>.</p>
"""), mapping=data))
    #if deferred:
    #    mailer.send_to_queue(message)
    #else:
    mailer.send(message)


def send_change_password_email(request, profile, email=None):
    mailer = get_mailer(request)
    localizer = request.localizer
    data = dict(
        name=profile.name, confirm_url=request.route_url(
            'do_password_change', ticket=password_token(profile)),
        assembl="Assembl")
    message = Message(
        subject=localizer.translate(_("Request for password change"), mapping=data),
        sender=config.get('assembl.admin_email'),
        recipients=["%s <%s>" % (profile.name, email or profile.get_preferred_email())],
        body=localizer.translate(_(u"""Hello, ${name}!
You asked to change your password on <${assembl}>. (We hope it was you!)\n
You can do this by clicking on the link below.
<${confirm_url}>
"""), mapping=data),
        html=localizer.translate(_(u"""<p>Hello, ${name}!</p>
<p>You asked to <a href="${confirm_url}">change your password</a> on ${assembl} (We hope it was you!)</p>
"""), mapping=data))
    #if deferred:
    #    mailer.send_to_queue(message)
    #else:
    mailer.send(message)
