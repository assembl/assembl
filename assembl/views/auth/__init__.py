"""views related to login, registration, etc."""

import sys

from social_pyramid.views import (
    auth as psa_auth_view, complete as psa_complete_view)


def includeme(config):
    """ This function returns a Pyramid WSGI application."""
    from ..discussion.views import react_view

    def legacy_contextual_route(name, route, from_root=True):
        config.add_route('contextual_'+name, '/debate/{discussion_slug}'+route)
        if from_root:
            config.add_route(name, "/legacy" + route)

    def react_contextual_route(name, route, from_root=True):
        name = "react_" + name
        if from_root:
            config.add_route(name, route)
            config.add_view(react_view, route_name=name,
                request_method='GET',
                renderer='assembl:templates/index_react.jinja2')

        name = "contextual_" + name
        config.add_route(name, '/{discussion_slug}' + route)
        config.add_view(react_view, route_name=name,
                        request_method='GET',
                        renderer='assembl:templates/index_react.jinja2')

    legacy_contextual_route('login', '/login')
    legacy_contextual_route('login_forceproviders', '/login_showallproviders')
    legacy_contextual_route('logout', '/logout')
    # type in u(sername), id, email, {velruse-id-type}
    config.add_route('profile_user', '/user/{type}/{identifier}')
    config.add_route('avatar', '/user/{type}/{identifier}/avatar/{size:\d+}')
    legacy_contextual_route('register', '/register')
    legacy_contextual_route('user_confirm_email', '/users/email_confirm/{token}')
    # Do we want this?
    # config.add_route('profile_search', '/usernames/{user_name}')
    # TODO: secure next three methods to avoid spamming the user.
    legacy_contextual_route('confirm_emailid_sent',
                     '/confirm_email_sent_id/{email_account_id:\d+}')
    legacy_contextual_route('confirm_email_sent', '/confirm_email_sent/{email}')

    legacy_contextual_route('password_change_sent',
                     '/password_change_sent/{profile_id:\d+}')
    legacy_contextual_route('request_password_change', '/req_password_change')
    legacy_contextual_route('do_password_change', '/do_password_change/{token}')
    legacy_contextual_route('welcome', '/welcome/{token}')
    legacy_contextual_route('finish_password_change', '/finish_password_change')
    config.add_route('contextual_social.auth', '/{discussion_slug}/login/{backend}') # for example: /sandbox/login/google-oauth2
    legacy_contextual_route('add_social_account', '/add_account/{backend}')

    # Keep those in synchrony with assembl/static2/js/app/routes.jsx
    react_contextual_route('login', '/login')
    react_contextual_route('register', '/signup')
    react_contextual_route('request_password_change', '/requestPasswordChange')
    react_contextual_route('do_password_change', '/changePassword')
    config.include('social_pyramid')
    config.scan()
    config.scan('social_pyramid')
