import json

from pyramid.view import view_config

from sqlalchemy.orm.exc import NoResultFound, MultipleResultsFound

from velruse import login_url

from ...auth.models import (IdentityProvider, AgentAccount, EmailAccount,
                            IdentityProviderAccount, AgentProfile, User)
from ...auth.operations import get_identity_provider
from ...lib.sqla import DBSession


@view_config(
    route_name='login',
    request_method='GET', http_cache=60,
    renderer='assembl:templates/login.jinja2',
)
def login_view(request):
    return {
        'login_url': login_url,
        'providers': request.registry.settings['login_providers'],
    }


@view_config(
    context='velruse.AuthenticationComplete',
    renderer='assembl:templates/login_result.jinja2',
)
def login_complete_view(request):
    context = request.context
    profile = context.profile
    provider = get_identity_provider(context.type)
    email = profile.get("verifiedEmail")
    if not email:
        emails = profile.get("emails")
        primary = [e.get("value") for e in emails
                   if isinstance(e, dict) and e.get("primary")]
        if primary and primary[0]:
            email = primary[0]
        elif emails:
            email = email[0]
            if isinstance(email, dict):
                email = email.get("value")

    for account in profile["accounts"]:
        try:
            found = DBSession.query(Account).filter(
                Account.provider == provider and
                Account.userid == account.get("userid") and
                Account.domain == account.get("domain") and
                Account.username == account.get("username")
            ).one()
            orgunit = found.orgunit
        except NoResultFound:
            orgunit = OrganizationalUnit(
                name=profile.displayName,
                )
            DBSession.add(orgunit)
            user = User(
                orgunit=orgunit
                )
            DBSession.add(user)
            found = Account(
                provider=provider,
                userid=account.get("userid"),
                domain=account.get("domain"),
                username=account.get("username"),
                email=email,
                orgunit=orgunit
                )
            DBSession.add(found)

    result = {
        'profile': profile,
        'credentials': context.credentials,
    }
    return {
        'result': json.dumps(result, indent=4),
    }


@view_config(
    context='velruse.AuthenticationDenied',
    renderer='assembl:templates/login_result.jinja2',
)
def login_denied_view(request):
    return {
        'result': 'denied',
    }
