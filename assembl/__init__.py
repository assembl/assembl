""" Pyramid add start-up module. """

from os import putenv
from os.path import dirname, join

import transaction
from pyramid.config import Configurator
from pyramid.authentication import SessionAuthenticationPolicy
from pyramid.authorization import ACLAuthorizationPolicy
from pyramid_beaker import session_factory_from_settings
from pyramid.i18n import default_locale_negotiator
from pyramid.settings import asbool
from zope.component import getGlobalSiteManager
import sqltap.wsgi

from .lib.sqla import configure_engine, session_maker_is_initialized
from .lib.locale import to_posix_format, ensure_locale_has_country
from .lib.config import set_config

# Do not import models here, it will break tests.

#Use a local odbc.ini
putenv('ODBCINI', join(dirname(dirname(__file__)), 'odbc.ini'))

locale_negotiator = default_locale_negotiator


# Do not import models here, it will break tests.
def main(global_config, **settings):
    """ Return a Pyramid WSGI application. """
    settings['config_uri'] = global_config['__file__']

    # here we create the engine and bind it to the (not really a) session
    # factory
    set_config(settings)
    if not session_maker_is_initialized():
        configure_engine(settings)
    if settings.get('assembl_debug_signal', False):
        from assembl.lib import signals
        signals.listen()

    from views.traversal import root_factory
    config = Configurator(registry=getGlobalSiteManager())
    config.setup_registry(settings=settings, root_factory=root_factory)
    config.add_translation_dirs('assembl:locale/')

    def my_locale_negotiator(request):
        available = settings['available_languages'].split()
        locale = None
        from assembl.auth.util import discussion_from_request
        discussion = discussion_from_request(request)
        if discussion:
            for locale in discussion.discussion_locales:
                if locale in available:
                    break
                if '_' not in locale:
                    locale = ensure_locale_has_country(locale)
                if locale and locale in available:
                    break
        else:
            locale = to_posix_format(default_locale_negotiator(request))
        if locale and locale not in available:
            locale_with_country = ensure_locale_has_country(locale)
            if locale_with_country:
                locale = locale_with_country
        if not locale:
            locale = to_posix_format(request.accept_language.best_match(
                available, settings.get('pyramid.default_locale_name', 'en')))
        request._LOCALE_ = locale
        return locale

    locale_negotiator = my_locale_negotiator
    config.set_locale_negotiator(my_locale_negotiator)
    config.add_tween(
        'assembl.tweens.virtuoso_deadlock.transient_deadlock_tween_factory',
        under="pyramid_tm.tm_tween_factory")

    # Tasks first, because it includes ZCA registration (for now)
    config.include('.tasks')

    config.include('pyramid_dogpile_cache')
    config.include('.lib.zmqlib')
    session_factory = session_factory_from_settings(settings)
    config.set_session_factory(session_factory)
    if not settings.get('nosecurity', False):
        # import after session to delay loading of BaseOps
        from auth.util import authentication_callback
        auth_policy = SessionAuthenticationPolicy(
            callback=authentication_callback)
        config.set_authentication_policy(auth_policy)
        config.set_authorization_policy(ACLAuthorizationPolicy())
    # ensure default roles and permissions at startup
    from models import get_session_maker
    from .models.auth import (
        populate_default_roles, populate_default_permissions)
    with transaction.manager:
        session = get_session_maker()
        populate_default_roles(session)
        populate_default_permissions(session)

    config.add_static_view('static', 'static', cache_max_age=3600)
    config.add_static_view('widget', 'widget', cache_max_age=3600)
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

    config.include('.view_def')

    wsgi_app = config.make_wsgi_app()
    if asbool(settings.get('sqltap', False)):
        wsgi_app = sqltap.wsgi.SQLTapMiddleware(wsgi_app)
    return wsgi_app
