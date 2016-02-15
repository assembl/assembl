import sys

from pyramid.settings import aslist


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
    contextual_route('finish_password_change', '/finish_password_change')

    # determine which providers we want to configure
    settings = config.get_settings()
    providers = aslist(settings['login_providers'])
    config.add_settings(login_providers=providers)
    config.add_settings(trusted_login_providers=aslist(
        settings.get('trusted_login_providers', '')))
    if not any(providers):
        sys.stderr.write('no login providers configured, double check '
                         'your ini file and add a few')
    settings = config.registry.settings
    for name in ('SOCIAL_AUTH_AUTHENTICATION_BACKENDS',
                 'SOCIAL_AUTH_USER_FIELDS',
                 'SOCIAL_AUTH_PROTECTED_USER_FIELDS'):
        settings[name] = settings.get(name, '').split("\n")
    config.add_request_method(
        'assembl.auth.social_auth.get_user', 'user', reify=True)
    config.include('social.apps.pyramid_app')
    config.scan()
    config.scan('social.apps.pyramid_app')
