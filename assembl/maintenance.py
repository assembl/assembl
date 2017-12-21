""" Pyramid add start-up module. """

from pyramid.httpexceptions import HTTPServiceUnavailable
from pyramid.config import Configurator
from pyramid.i18n import default_locale_negotiator, TranslationStringFactory
from zope.component import getGlobalSiteManager


maintenance_template = '''\
<h1 style="text-align:center">${detail}</h1>${br}${br}
${html_comment}
'''


def maintenance_message(request):
    _ = TranslationStringFactory('assembl')
    localizer = request.localizer
    return HTTPServiceUnavailable(
        localizer.translate(_("Assembl is down for maintenance. We'll be back in a few minutes.")),
        body_template=maintenance_template)


# Do not import models here, it will break tests.
def main(global_config, **settings):
    """ Return a Pyramid WSGI application. """
    settings['config_uri'] = global_config['__file__']

    config = Configurator(registry=getGlobalSiteManager())
    config.setup_registry(settings=settings)
    config.add_translation_dirs('assembl:locale/')

    def my_locale_negotiator(request):
        locale = default_locale_negotiator(request)
        available = settings['available_languages'].split()
        locale = locale if locale in available else None
        if not locale:
            locale = request.accept_language.best_match(
                available, settings.get('pyramid.default_locale_name', 'en'))
        request._LOCALE_ = locale
        return locale

    config.set_locale_negotiator(my_locale_negotiator)

    config.add_static_view('static', 'static', cache_max_age=3600)
    config.add_static_view('widget', 'widget', cache_max_age=3600)

    config.add_view(maintenance_message)
    config.add_notfound_view(maintenance_message)
    return config.make_wsgi_app()
