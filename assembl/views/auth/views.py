import json

from pyramid.view import view_config

from velruse import login_url


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

    result = {
        'profile': context.profile,
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
