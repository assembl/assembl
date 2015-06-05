""" App URL routing and renderers are configured in this module. """

import os.path
import codecs
from collections import defaultdict

import simplejson as json
from pyramid.view import view_config
from pyramid.response import Response
from velruse.exceptions import CSRFError
from pyramid.httpexceptions import (
    HTTPException, HTTPInternalServerError, HTTPMovedPermanently,
    HTTPBadRequest)
from pyramid.i18n import TranslationStringFactory
from pyramid.settings import asbool, aslist

from ..lib.json import json_renderer_factory
from ..lib import config
from ..lib.frontend_urls import FrontendUrls
from ..lib.locale import get_language, get_country

default_context = {
    'STATIC_URL': '/static'
}

TEMPLATE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'templates')

def backbone_include(config):
    FrontendUrls.register_frontend_routes(config)
    config.add_route('styleguide', '/styleguide')
    config.add_route('test', '/test')
    config.add_route('graph_view', '/graph')



def get_theme(discussion):
    theme_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'css', 'themes')
    default_theme = config.get('default_theme') or 'default'
    #default_folder = os.path.realpath(os.path.join(theme_path, default_theme))
    if not discussion:
        return default_theme
    try:
        slug_file = os.path.realpath(os.path.join(theme_path, discussion.slug))
        if os.path.isdir(slug_file):
            return discussion.slug
    except NameError:
        return default_theme
    return default_theme

def get_default_context(request):
    from ..auth.util import get_user, get_current_discussion
    localizer = request.localizer
    _ = TranslationStringFactory('assembl')
    user = get_user(request)
    if user and user.username:
        user_profile_edit_url = request.route_url(
            'profile_user', type='u', identifier=user.username.username)
    elif user:
        user_profile_edit_url = request.route_url(
            'profile_user', type='id', identifier=user.id)
    else:
        user_profile_edit_url = None

    web_analytics_piwik_script = config.get('web_analytics_piwik_script') or False
    discussion = get_current_discussion()
    if web_analytics_piwik_script and discussion and discussion.web_analytics_piwik_id_site:
        web_analytics_piwik_script = web_analytics_piwik_script % ( discussion.web_analytics_piwik_id_site, discussion.web_analytics_piwik_id_site )
    else:
        web_analytics_piwik_script = False

    help_url = config.get('help_url') or ''
    if discussion and discussion.help_url:
        help_url = discussion.help_url
    if help_url and "%s" in help_url:
        help_url = help_url % localizer.locale_name

    first_login_after_auto_subscribe_to_notifications = False
    # FIXME: user.is_first_visit does not seem to work, as it is always false, to right now first_login_after_auto_subscribe_to_notifications can never become True and so the popin can never be shown
    if user and discussion and discussion.id and user.is_first_visit and discussion.subscribe_to_notifications_on_signup:
        # set session variable, so that we show the popin only once in the session
        # TODO: use a different flag for each discussion, so that if the user joins several auto-subscribing discussions during the same logged-in session, we show one popin for every discussion
        if not request.session.get('first_login_after_auto_subscribe_to_notifications_popin_has_been_shown', False):
            request.session['first_login_after_auto_subscribe_to_notifications_popin_has_been_shown'] = True
            first_login_after_auto_subscribe_to_notifications = True
    locales = config.get('available_languages').split()
    countries_for_locales = defaultdict(set)
    for locale in locales:
        countries_for_locales[get_language(locale)].add(get_country(locale))
    print "countries_for_locales", countries_for_locales
    show_locale_country = {
        locale: (len(countries_for_locales[get_language(locale)]) > 1)
        for locale in locales}
    print "show_lang_country", show_locale_country
    jedfilename = os.path.join(
            os.path.dirname(__file__), '..', 'locale',
            localizer.locale_name, 'LC_MESSAGES', 'assembl.jed.json')
    if not os.path.exists(jedfilename) and '_' in localizer.locale_name:
        jedfilename = os.path.join(
            os.path.dirname(__file__), '..', 'locale',
            get_language(localizer.locale_name), 'LC_MESSAGES', 'assembl.jed.json')
    assert os.path.exists(jedfilename)
    providers = aslist(config.get('login_providers'))

    return dict(
        default_context,
        request=request,
        user=user,
        templates=get_template_views(),
        discussion={},  # Templates won't load without a discussion object
        user_profile_edit_url=user_profile_edit_url,
        locale=localizer.locale_name,
        locales=locales,
        show_locale_country=show_locale_country,
        theme=get_theme(discussion),
        minified_js=config.get('minified_js') or False,
        web_analytics_piwik_script=web_analytics_piwik_script,
        help_url=help_url,
        first_login_after_auto_subscribe_to_notifications=first_login_after_auto_subscribe_to_notifications,
        raven_url=config.get('raven_url') or '',
        providers=json.dumps(providers),
        translations=codecs.open(jedfilename, encoding='utf-8').read()
        )


def get_template_views():
    """ get all .tmpl files from templates/views directory """
    views_path = os.path.join(TEMPLATE_PATH, 'views')
    views = []

    for (dirpath, dirname, filenames) in os.walk(views_path):
        for filename in filenames:
            if filename.endswith('.tmpl'):
                views.append(filename.split('.')[0])

    return views


class JSONError(HTTPException):
    content_type = 'text/plain'

    def __init__(self, code, detail=None, headers=None, comment=None,
                 body_template=None, **kw):
        self.code = code
        self.content_type = 'text/plain'
        super(JSONError, self).__init__(
            detail, headers, comment,
            body='{"error":"%s", "status":%d}' % (detail, code), **kw)

        def prepare(self, environ):
            r = super(JSONError, self).prepare(environ)
            self.content_type = 'text/plain'
            return r


@view_config(context=CSRFError)
def csrf_error_view(exc, request):
    if "HTTP_COOKIE" not in request.environ:
        user_agent = request.user_agent
        is_safari = 'Safari' in user_agent and 'Chrome' not in user_agent
        route_name = request.matched_route.name
        is_login_callback = route_name.startswith('velruse.') and route_name.endswith('-callback')
        if is_safari and is_login_callback:
            # This is an absolutely horrible hack, but depending on some settings,
            # Safari does not give cookies on a redirect, so we lose session info.
            if 'reload' not in request.GET:
                # So first make sure the new session does not kill the old one
                def callback(request, response):
                    response._headerlist = [(h, v) for (h, v) in response._headerlist if h != 'Set-Cookie']
                    print "headerlist:", response._headerlist
                request.add_response_callback(callback)
                # And return a page that will reload the same request, NOT through a 303.
                # Also add a "reload" parameter to avoid doing it twice if it failed.
                template = ('<html><head><script>document.location = "' +
                    request.path_info + '?' + request.query_string +
                    '&reload=true"</script></head></html>')
                return Response(template, content_type='text/html')
            else:
                # The hack failed. Tell the user what to do.
                return HTTPBadRequest(explanation="Missing cookies", detail="""Note that we need active cookies.
                    On Safari, the "Allow from current website only" option
                    in the Privacy tab of preferences is too restrictive;
                    use "Allow from websites I visit" and try again. Simply reloading may work.""")
        return HTTPBadRequest(explanation="Missing cookies", detail=repr(request.exception))
    return  HTTPBadRequest(explanation="CSRF error", detail=repr(request.exception))


def error_view(exc, request):
    # from traceback import format_exc
    from datetime import datetime
    from assembl.lib.raven_client import get_raven_client
    raven_client = get_raven_client()
    if raven_client:
        raven_client.captureException(getattr(request, "exc_info", None))
    return HTTPInternalServerError(
        explanation="Sorry, Assembl had an internal issue and you have to reload. Please send this to a discussion administrator.",
        detail=datetime.now().isoformat()+"\n"+repr(request.exception))
        # format_exc(request.exception))


def includeme(config):
    """ Initialize views and renderers at app start-up time. """

    config.add_renderer('json', json_renderer_factory)
    config.include('.traversal')

    config.add_route('discussion_list', '/')
    
    config.include(backbone_include, route_prefix='/{discussion_slug}')

    if asbool(config.get_settings().get('assembl_handle_exceptions', 'true')):
        config.add_view(error_view, context=Exception)

    #  authentication
    config.include('.auth')

    config.include('.api')
    config.include('.api2')

    config.include('.home')
    config.include('.admin')
    
    config.add_route('home', '/{discussion_slug}')
    config.add_route('home-auto', '/{discussion_slug}/')
    def redirector(request):
        return HTTPMovedPermanently(request.route_url('home', discussion_slug=request.matchdict.get('discussion_slug')))
    config.add_view(redirector, route_name='home-auto')
    default_context['socket_url'] = \
        config.registry.settings['changes.websocket.url']
    default_context['cache_bust'] = \
        config.registry.settings['requirejs.cache_bust']
