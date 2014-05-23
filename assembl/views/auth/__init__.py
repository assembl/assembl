import sys

from pyramid.settings import aslist

def includeme(config):
    """ This function returns a Pyramid WSGI application."""

    config.add_route('login', '/login')
    config.add_route('logout', '/logout')
    # type in u(sername), id, email, {velruse-id-type}
    config.add_route('profile', '/user/{type}/{identifier}')
    config.add_route('avatar', '/user/{type}/{identifier}/avatar/{size:\d+}')
    config.add_route('register', '/register')
    config.add_route('user_confirm_email', '/users/email_confirm/{ticket}')
    # TODO: secure next three methods to avoid spamming the user.
    # First one may be obsolete?
    config.add_route('confirm_user_email', '/user_confirm/{email_account_id:\d+}')
    #config.add_route('profile_search', '/usernames/{user_name}')  Do we want this?
    config.add_route('confirm_email_request', '/req_email_confirm/{email}')
    config.add_route('password_change_request', '/req_password_change/{email}')

    # determine which providers we want to configure
    settings = config.get_settings()
    providers = aslist(settings['login_providers'])
    config.add_settings(login_providers=providers)
    config.add_settings(trusted_login_providers=aslist(
        settings.get('trusted_login_providers', '')))
    if not any(providers):
        sys.stderr.write('no login providers configured, double check '
                         'your ini file and add a few')

    if 'facebook' in providers:
        config.include('velruse.providers.facebook')
        config.add_facebook_login_from_settings(prefix='facebook.')

    if 'github' in providers:
        config.include('velruse.providers.github')
        config.add_github_login_from_settings(prefix='github.')

    if 'twitter' in providers:
        config.include('velruse.providers.twitter')
        config.add_twitter_login_from_settings(prefix='twitter.')

    if 'live' in providers:
        config.include('velruse.providers.live')
        config.add_live_login_from_settings(prefix='live.')

    if 'bitbucket' in providers:
        config.include('velruse.providers.bitbucket')
        config.add_bitbucket_login_from_settings(prefix='bitbucket.')

    if 'google' in providers:
        config.include('velruse.providers.google_oauth2')
        config.add_google_oauth2_login(
            #realm=settings['google.realm'],
            consumer_key=settings['google.consumer_key'],
            consumer_secret=settings['google.consumer_secret'],
        )

    if 'openid' in providers:
        config.include('velruse.providers.openid')
        config.add_openid_login(
            realm=settings['openid.realm']
        )

    if 'yahoo' in providers:
        config.include('velruse.providers.yahoo')
        config.add_yahoo_login(
            realm=settings['yahoo.realm'],
            consumer_key=settings['yahoo.consumer_key'],
            consumer_secret=settings['yahoo.consumer_secret'],
        )
