"""views related to login, registration, etc."""

import sys

from social.apps.pyramid_app.views import (
    auth as psa_auth_view, complete as psa_complete_view)


def includeme(config):
    """ This function returns a Pyramid WSGI application."""

    def contextual_route(name, route, from_root=True):
        config.add_route('contextual_'+name, '/{discussion_slug}'+route)
        if from_root:
            config.add_route(name, route)

    contextual_route('login', '/login')
    contextual_route('login_forceproviders', '/login_showallproviders')
    contextual_route('logout', '/logout')
    # type in u(sername), id, email, {velruse-id-type}
    config.add_route('profile_user', '/user/{type}/{identifier}')
    config.add_route('avatar', '/user/{type}/{identifier}/avatar/{size:\d+}')
    contextual_route('register', '/register')
    contextual_route('user_confirm_email', '/users/email_confirm/{ticket}')
    # Do we want this?
    # config.add_route('profile_search', '/usernames/{user_name}')
    # TODO: secure next three methods to avoid spamming the user.
    contextual_route('confirm_emailid_sent',
                     '/confirm_email_sent_id/{email_account_id:\d+}')
    contextual_route('confirm_email_sent', '/confirm_email_sent/{email}')

    contextual_route('password_change_sent',
                     '/password_change_sent/{profile_id:\d+}')
    contextual_route('request_password_change', '/req_password_change')
    contextual_route('do_password_change', '/do_password_change/{ticket}')
    contextual_route('welcome', '/welcome/{ticket}')
    contextual_route('finish_password_change', '/finish_password_change')
    config.add_route('contextual_social_auth', '/{discussion_slug}/login/{backend}')
    contextual_route('add_social_account', '/add_account/{backend}')
    config.include('social.apps.pyramid_app')
    config.scan()
    config.scan('social.apps.pyramid_app')
