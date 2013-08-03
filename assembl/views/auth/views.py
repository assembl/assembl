import json
from datetime import datetime

from gettext import gettext as _

from pyramid.view import view_config
from pyramid.renderers import render_to_response
from pyramid.security import (
    remember,
    # forget,
    authenticated_userid,
    NO_PERMISSION_REQUIRED
    )
from pyramid.httpexceptions import (
    exception_response,
    HTTPUnauthorized,
    HTTPFound,
    HTTPServerError
    )

from sqlalchemy.orm.exc import NoResultFound
import transaction

from velruse import login_url

from ...auth.models import (IdentityProvider, EmailAccount,
                            IdentityProviderAccount, AgentProfile, User,
                            IdentityProviderEmail)
from ...auth.operations import get_identity_provider
from ...auth.utils import hash_password, format_token
from ...db import DBSession


@view_config(
    route_name='login',
    request_method='GET', http_cache=60,
    renderer='assembl:templates/login.jinja2',
)
@view_config(
    renderer='users/login.jinja2',
    context='pyramid.exceptions.Forbidden',
    permission=NO_PERMISSION_REQUIRED
)
def login_view(request):
    # TODO: In case of forbidden, get the URL and pass it along.
    return {
        'login_url': login_url,
        'providers': request.registry.settings['login_providers'],
    }


@view_config(
    route_name='profile',
    request_method='GET',
    renderer='assembl:templates/view_profile.jinja2'
    # Add permissions to view a profile?
    )
def assembl_view_profile(request):
    username = request.matchdict.get('username', '').strip()
    try:
        user = DBSession.query(User).filter_by(username=username).one()
    except NoResultFound:
        raise exception_response(404)
    logged_in = authenticated_userid(request)

    if logged_in == user.id:
        # Viewing my own profile
        return render_to_response('assembl:templates/profile.jinja2', {
            'providers': request.registry.settings['login_providers'],
            'user': user
            })
        return profile_page(request, user.profile)
    return {
        'user': user
    }


@view_config(
    route_name='profile',
    request_method='POST',
    renderer='assembl:templates/profile.jinja2'
    # Add permissions to view a profile?
    )
def assembl_modify_profile(request):
    username = request.matchdict.get('username', '').strip()
    try:
        user = DBSession.query(User).filter_by(username=username).one()
    except NoResultFound:
        raise exception_response(404)
    logged_in = authenticated_userid(request)
    if logged_in != user.id:
        raise HTTPUnauthorized()
    # TODO: Save stuff
    return {
        'providers': request.registry.settings['login_providers'],
        'user': user
    }


@view_config(
    route_name='unnamed_profile',
    request_method='GET',
    renderer='assembl:templates/view_profile.jinja2'
    # Add permissions to view a profile?
    )
def assembl_view_unnamed_profile(request):
    id = int(request.matchdict.get('id'))
    try:
        user = DBSession.query(User).get(id)
    except NoResultFound:
        raise exception_response(404)
    logged_in = authenticated_userid(request)
    print logged_in
    print user.id, user
    if logged_in == user.id:
        # Viewing my own profile
        return render_to_response('assembl:templates/profile.jinja2', {
            'providers': request.registry.settings['login_providers'],
            'user': user
            })
    return {
        'user': user
    }


@view_config(
    route_name='unnamed_profile',
    request_method='POST',
    renderer='assembl:templates/profile.jinja2'
    # Add permissions to view a profile?
    )
def assembl_modify_unnamed_profile(request):
    id = int(request.matchdict.get('id'))
    try:
        user = DBSession.query(User).get(id)
    except NoResultFound:
        raise exception_response(404)
    logged_in = authenticated_userid(request)
    if logged_in != user.id:
        raise HTTPUnauthorized()
    # TODO: Save stuff
    return {
        'providers': request.registry.settings['login_providers'],
        'user': user
    }


@view_config(
    route_name='create_user',
    request_method='POST',
    permission=NO_PERMISSION_REQUIRED,
    renderer='assembl:templates/register.jinja2'
)
def assembl_create_user_view(request):
    username = request.params.get('username', '').strip()
    password = request.params.get('password', '').strip()
    email = request.params.get('password', '').strip()
    # Find agent account to avoid duplicates!
    if DBSession.query(User).filter_by(username=username).count():
        return {
            'error': _("This username already exists")
        }
    #TODO: Validate password quality
    # otherwise create.
    profile = AgentProfile()
    user = User(
        profile=profile,
        username=username,
        password=hash_password(password),
        creation_date=datetime.now()
        )
    email_account = EmailAccount(
        email=email,
        profile=profile
        )
    DBSession.add(user)
    DBSession.add(email_account)
    transaction.commit()
    # TODO: Instead of assuming that the user is logged in now,
    # Send confirm email and wait for confirmation.
    headers = remember(request, user.id, tokens=format_token(user))
    request.response.headerlist.extend(headers)
    # Redirect to profile page. TODO: Remember another URL
    raise HTTPFound(location='/users/'+username)


@view_config(
    route_name='login',
    request_method='POST',
    permission=NO_PERMISSION_REQUIRED,
    renderer='assembl:templates/login.jinja2'
)
def assembl_login_complete_view(request):
    # Check if proper authorization. Otherwise send to another page.
    username = request.params.get('username', '').strip()
    password = request.params.get('password', '').strip()
    logged_in = authenticated_userid(request)
    if logged_in:
        if logged_in != request.userid:
            pass  # Do we need to log out old user? Forget credentials?
        # re-logging in? Why?
        raise HTTPFound(location='/users/'+username)
    user = DBSession.query(User).filter_by(username=username).first()
    if not user:
        return {
            'error': _("This user cannot be found")
        }
    if user.password != hash_password(password):
        user.login_failures += 1
        #TODO: handle high failure count
        DBSession.add(user)
        transaction.commit()
        return {'error': _("Invalid user and password")}
    headers = remember(request, user.id, tokens=format_token(user))
    request.response.headerlist.extend(headers)
    # Redirect to profile page. TODO: Remember another URL
    raise HTTPFound(location='/users/'+username)


@view_config(
    context='velruse.AuthenticationComplete'
)
def velruse_login_complete_view(request):
    context = request.context
    velruse_profile = context.profile
    provider = get_identity_provider(context)
    logged_in = authenticated_userid(request)
    # find or create IDP_Accounts
    idp_accounts = []
    new_idp_accounts = []
    velruse_accounts = velruse_profile['accounts']
    for velruse_account in velruse_accounts:
        if 'userid' in velruse_account:
            idp_account = DBSession.query(IdentityProviderAccount).filter_by(
                provider=provider,
                domain=velruse_account['domain'],
                userid=velruse_account['userid']
            ).first()
            if idp_account:
                idp_accounts.append(idp_account)
        elif 'username' in velruse_account:
            idp_account = DBSession.query(IdentityProviderAccount).filter_by(
                provider=provider,
                domain=velruse_account['domain'],
                username=velruse_account['username']
            ).first()
            if idp_account:
                idp_accounts.append(idp_account)
        else:
            raise HTTPServerError()
    if not idp_accounts:
        idp_account = IdentityProviderAccount(
            provider=provider,
            domain=velruse_account.get('domain'),
            userid=velruse_account.get('userid'),
            username=velruse_account.get('username')
            )
        idp_accounts.append(idp_account)
        new_idp_accounts.append(idp_account)
        DBSession.add(idp_account)
    # find AgentProfile
    profiles = set((a.profile for a in idp_accounts if a.profile))
    if len(profiles) > 1:
        # special case: Multiple profiles. We need to combine them to 1
        # TODO
        pass
    if len(profiles):
        profile = profiles.pop()
        user = profile.user
        if user:
            username = profile.user.username
    else:
        # Create a new profile and user
        profile = AgentProfile(name=velruse_profile['displayName'])

        DBSession.add(profile)
        username = None
        usernames = set((a['preferredUsername'] for a in velruse_accounts
                         if 'preferredUsername' in a))
        for u in usernames:
            if not DBSession.query(User).filter_by(username=u).count():
                username = u
                break
        user = User(
            profile=profile,
            username=username,
            verified=True,
            last_login=datetime.now(),
            creation_date=datetime.now(),
            #timezone=velruse_profile['utcOffset'],   # needs parsing
            )
        DBSession.add(user)
    for idp_account in new_idp_accounts:
        idp_account.profile = profile
    confirmed_email_accounts = {ea.email: ea for ea in profile.email_accounts}
    if provider.trust_emails:
        # There may be new emails in the accounts
        if 'verifiedEmail' in velruse_profile:
            email = velruse_profile['verifiedEmail']
        if email in confirmed_email_accounts:
            email_account = confirmed_email_accounts[email]
            if not email_account.verified:
                email_account.verified = True
                DBSession.add(email_account)
        else:
            email_account = EmailAccount(
                email=email,
                verified=True,
                profile=profile
                )
            confirmed_email_accounts[email] = email_account
    for email in velruse_profile.get('emails', []):
        preferred = False
        if isinstance(email, dict):
            preferred = email.get('preferred', False)
            email = email['value']
        if email not in confirmed_email_accounts:
            # Here, assume a single idp_account. Likely true.
            # TODO: Cleanup
            if idp_account not in new_idp_accounts:
                if DBSession.query(IdentityProviderEmail).filter_by(
                    idprovider_account=idp_account, email=email
                    ).count():
                        continue
            idp_email = IdentityProviderEmail(
                email=email,
                preferred=preferred,
                idprovider_account=idp_account
                )
            DBSession.add(idp_email)
    # TODO: Clean old IdentityProviderEmails
    DBSession.flush()
    user_id = user.id
    transaction.commit()
    # TODO: Store the OAuth etc. credentials. Though that may be done by velruse?
    # Also session stuff.
    if username:
        raise HTTPFound(location='/users/'+username)
    else:
        raise HTTPFound(location='/ext_user/'+str(user_id))


@view_config(
    context='velruse.AuthenticationDenied',
    renderer='assembl:templates/profile.jinja2',
)
def login_denied_view(request):
    return {
        'result': 'denied',
    }
    # TODO: If logged in otherwise, go to profile page. Otherwise, back to login page
