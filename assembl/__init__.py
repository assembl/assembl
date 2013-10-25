""" Pyramid add start-up module. """

from pyramid.config import Configurator
from pyramid.authentication import SessionAuthenticationPolicy
from pyramid.authorization import ACLAuthorizationPolicy
from pyramid_beaker import session_factory_from_settings

from .lib.sqla import configure_engine

# Do not import models here, it will break tests.

def main(global_config, **settings):
    """ Return a Pyramid WSGI application. """
    settings['config_uri'] = global_config['__file__']

    # here we create the engine and bind it to the (not really a) session
    # factory
    configure_engine(settings)

    config = Configurator(settings=settings)
    session_factory = session_factory_from_settings(
            settings
            )
    config.set_session_factory(session_factory)
    # import after session to delay loading of BaseOps
    from auth import authentication_callback
    auth_policy = SessionAuthenticationPolicy(callback=authentication_callback)
    config.set_authentication_policy(auth_policy)
    config.set_authorization_policy(ACLAuthorizationPolicy())
    config.add_static_view('static', 'static', cache_max_age=3600)
    config.include('cornice')  # REST services library.
    # config.include('.lib.alembic')
    # config.include('.lib.email')
    config.include('.views')

    # config.scan('.lib')
    config.scan('.views')

    # jinja2
    config.include('pyramid_jinja2')

    # Mailer
    config.include('pyramid_mailer')

    
    return config.make_wsgi_app()
