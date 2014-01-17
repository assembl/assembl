""" Pyramid add start-up module. """

import transaction

from pyramid.config import Configurator
from pyramid.authentication import SessionAuthenticationPolicy
from pyramid.authorization import ACLAuthorizationPolicy
from pyramid_beaker import session_factory_from_settings

from .lib.sqla import configure_engine


def my_locale_negotiator(request):
    if not hasattr(request, '_LOCALE_'):
        request._LOCALE_ = request.accept_language.best_match(
            ('en', 'fr'), 'en')

    return request._LOCALE_

# Do not import models here, it will break tests.
def main(global_config, **settings):
    """ Return a Pyramid WSGI application. """
    settings['config_uri'] = global_config['__file__']

    # here we create the engine and bind it to the (not really a) session
    # factory
    configure_engine(settings)

    from views import root_factory
    config = Configurator(settings=settings, root_factory=root_factory)
    config.add_translation_dirs('assembl:locale/')
    config.set_locale_negotiator(my_locale_negotiator)

    config.include('.lib.zmqlib')
    session_factory = session_factory_from_settings(settings)
    config.set_session_factory(session_factory)
    if not settings.get('nosecurity', False):
        # import after session to delay loading of BaseOps
        from auth import authentication_callback
        auth_policy = SessionAuthenticationPolicy(
            callback=authentication_callback)
        config.set_authentication_policy(auth_policy)
        config.set_authorization_policy(ACLAuthorizationPolicy())
    # ensure default roles and permissions at startup
    from models import get_session_maker
    from auth.models import (
        populate_default_roles, populate_default_permissions)
    with transaction.manager:
        session = get_session_maker()
        populate_default_roles(session)
        populate_default_permissions(session)
    config.add_static_view('static', 'static', cache_max_age=3600)
    config.include('cornice')  # REST services library.
    # config.include('.lib.alembic')
    # config.include('.lib.email')
    config.include('.views')

    # config.scan('.lib')
    config.scan('.views')

    # jinja2
    config.include('pyramid_jinja2')
    config.add_jinja2_extension('jinja2.ext.i18n')

    # Mailer
    config.include('pyramid_mailer')

    # Tasks
    #config.include('.tasks')

    config.include('.view_def')

    return config.make_wsgi_app()
