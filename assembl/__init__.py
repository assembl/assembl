"""Assembl is an application for Collective Intelligence.

This is the startup module, which sets up the various components:

1. A Pyramid_ WSGI app
2. The SQLAlchemy_ models_
3. Authentication with Beaker_ sessions

.. _Pyramid: http://www.pylonsproject.org/
.. _SQLAlchemy: http://www.sqlalchemy.org/
.. _Beaker: http://beaker.readthedocs.io/en/latest/
.. _models: :py:mod:`assembl.models`

"""

import transaction
from pyramid.config import Configurator
from pyramid.authorization import ACLAuthorizationPolicy
from pyramid_beaker import session_factory_from_settings
from pyramid.settings import asbool
from pyramid.path import DottedNameResolver
from zope.component import getGlobalSiteManager

from .lib.sqla import (
    configure_engine, session_maker_is_initialized)
from .lib.locale import locale_negotiator as my_locale_negotiator
from .lib.config import set_config

# Do not import models here, it will break tests.

resolver = DottedNameResolver(__package__)

# Do not import models here, it will break tests.
# WSGI calls main. This is a convention.


def main(global_config, **settings):
    """ Return a Pyramid WSGI application. """
    settings['config_uri'] = global_config['__file__']

    # here we create the engine and bind it to the (not really a) session
    # factory
    settings = set_config(settings)
    if not session_maker_is_initialized():
        configure_engine(settings)
    if settings.get('assembl_debug_signal', False):
        from assembl.lib import signals
        signals.listen()

    import os
    if 'UWSGI_ORIGINAL_PROC_NAME' in os.environ:
        # uwsgi does not load logging properly
        from pyramid.paster import setup_logging
        setup_logging(global_config['__file__'])

    from views.traversal import root_factory
    config = Configurator(registry=getGlobalSiteManager())
    config.setup_registry(settings=settings, root_factory=root_factory)
    config.add_translation_dirs('assembl:locale/')

    config.set_locale_negotiator(my_locale_negotiator)
    config.add_tween(
        'assembl.tweens.logging.logging_tween_factory',
        over="pyramid_tm.tm_tween_factory")

    config.include('.auth')
    config.include('.models')
    config.include('.indexing')
    config.include('.lib.logging')
    # Tasks first, because it includes ZCA registration (for now)
    config.include('.tasks')

    config.include('.lib.zmqlib')
    session_factory = session_factory_from_settings(settings)
    config.set_session_factory(session_factory)
    if not settings.get('nosecurity', False):
        # import after session to delay loading of BaseOps
        from auth.util import authentication_callback
        auth_policy_name = settings.get(
            "auth_policy_class", "assembl.auth.util.UpgradingSessionAuthenticationPolicy")
        auth_policy = resolver.resolve(auth_policy_name)(
            callback=authentication_callback)
        config.set_authentication_policy(auth_policy)
        config.set_authorization_policy(ACLAuthorizationPolicy())
    # ensure default roles and permissions at startup
    from models import get_session_maker
    if not settings.get('in_migration', False):
        with transaction.manager:
            session = get_session_maker()
            from .lib.migration import bootstrap_db_data
            bootstrap_db_data(session, settings['config_uri'] != "testing.ini")

    config.add_static_view('static', 'static', cache_max_age=3600)
    config.add_static_view('static2', 'static2', cache_max_age=3600)
    config.include('.graphql')  # This MUST be above views import

    config.include('cornice')  # REST services library.
    # config.include('.lib.alembic')
    # config.include('.lib.email')
    config.include('.lib')
    config.include('.views')

    # jinja2
    config.include('pyramid_jinja2')
    config.add_jinja2_extension('jinja2.ext.i18n')

    # Mailer
    config.include('pyramid_mailer')

    config.include('.view_def')

    wsgi_app = config.make_wsgi_app()
    if asbool(settings.get('sqltap', False)):
        import sqltap.wsgi
        wsgi_app = sqltap.wsgi.SQLTapMiddleware(wsgi_app)
    return wsgi_app
