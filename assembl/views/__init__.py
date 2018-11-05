""" App URL routing and renderers are configured in this module.

Note that Assembl is a `hybrid app`_, and combines routes and :py:mod:`traversal`.

.. _`hybrid app`: http://docs.pylonsproject.org/projects/pyramid/en/latest/narr/hybrid.html
"""

import os
import io
from collections import defaultdict
from urlparse import urlparse

import simplejson as json
from pyramid.view import view_config
from pyramid.response import Response
from pyramid.httpexceptions import (
    HTTPInternalServerError, HTTPMovedPermanently, HTTPError,
    HTTPBadRequest, HTTPFound, HTTPTemporaryRedirect as HTTPTemporaryRedirectP)
from pyramid.i18n import TranslationStringFactory
from pyramid.security import Everyone
from pyramid.settings import asbool, aslist
from social_core.exceptions import AuthMissingParameter

from assembl.lib.json import json_renderer_factory
from assembl.lib import config
from assembl.lib.frontend_urls import FrontendUrls
from assembl.lib.locale import (
    get_language, get_country, to_posix_string, strip_country)
from assembl.lib.utils import get_global_base_url
from assembl.lib.raven_client import capture_exception
from assembl.models.auth import (
    UserLanguagePreference,
    LanguagePreferenceOrder,
    User,
    Locale,
)


default_context = {
    'STATIC_URL': '/static',
}


TEMPLATE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), 'templates')


class HTTPTemporaryRedirect(HTTPTemporaryRedirectP):

    def __init__(self, *args, **kwargs):
        kwargs["cache_control"] = "no-cache"
        super(HTTPTemporaryRedirect, self).__init__(*args, **kwargs)
        self.cache_control.prevent_auto = True


def backbone_include(config):
    FrontendUrls.register_frontend_routes(config)
    config.add_route('styleguide', '/styleguide')
    config.add_route('test', '/test')


def legacy_backbone_include(config):
    FrontendUrls.register_legacy_routes(config)


def get_theme_base_path(frontend_version=1):
    frontend_folder = 'static2' if frontend_version == 2 else 'static'
    theme_base_path = os.path.join(os.path.dirname(os.path.dirname(__file__)),
                                   frontend_folder, 'css', 'themes')
    return theme_base_path


def find_theme(theme_name, frontend_version=1):
    """
    Recursively looks for a theme with the provided name in the theme path folder
    @returns the theme path fragment relative to the theme base_path, or
    None if not found
    """
    theme_base_path = get_theme_base_path(frontend_version)

    walk_results = os.walk(theme_base_path, followlinks=True)
    for (dirpath, dirnames, filenames) in walk_results:
        if '_theme.scss' in filenames:
            # print repr(dirpath), repr(dirnames) , repr(filenames)
            relpath = os.path.relpath(dirpath, theme_base_path)
            (head, name) = os.path.split(dirpath)
            print name, relpath
            if name == theme_name:
                return relpath

    return None


def get_theme_info(discussion, frontend_version=1):
    """
    @return (theme_name, theme_relative_path) the relative path is relative to the theme_base_path.  See find_theme.
    """
    theme_name = config.get('default_theme') or 'default'
    theme_path = None
    if discussion:
        # Legacy code: Slug override
        theme_path = find_theme(discussion.slug, frontend_version)
    if theme_path:
        theme_name = discussion.slug
    else:
        theme_path = find_theme(theme_name, frontend_version)
    if theme_path is not None:
        return (theme_name, theme_path)
    else:
        return ('default', 'default')


def get_provider_data(get_route, providers=None):
    from assembl.models.auth import IdentityProvider
    if providers is None:
        providers = aslist(config.get('login_providers'))
    providers_by_name = IdentityProvider.default_db.query(
        IdentityProvider.name, IdentityProvider.provider_type
    ).order_by(IdentityProvider.id).all()
    saml_providers = []
    if 'saml' in providers:
        providers.remove('saml')
        saml_providers = config.get('SOCIAL_AUTH_SAML_ENABLED_IDPS')
        if not isinstance(saml_providers, dict):
            saml_providers = json.loads(saml_providers)
    provider_data = [
        {
            "name": name.capitalize(),
            "type": ptype,
            "extra": {},
            "add_social_account": get_route(
                'add_social_account', backend=ptype),
            "login": get_route('social.auth', backend=ptype),
        } for (name, ptype) in providers_by_name
        if ptype in providers
    ]
    if 'yahoo' in providers:
        for provider in provider_data:
            if provider['type'] == 'yahoo':
                provider['extra'] = {
                    "oauth": True,
                    "openid_identifier": 'yahoo.com',
                }
    if saml_providers:
        provider_data.extend([
            {
                "name": data["description"],
                "type": "saml",
                "add_social_account": get_route(
                    'add_social_account', backend='saml'),
                "login": get_route('social.auth', backend='saml'),
                "extra": {
                    "idp": prov_id
                }
            }
            for prov_id, data in saml_providers.iteritems()
        ])

    return provider_data


def create_get_route(request, discussion=0):
    if discussion is 0:  # None would be a known absence, don't recalculate
        from assembl.auth.util import discussion_from_request
        discussion = discussion_from_request(request)
    from assembl.lib.frontend_urls import FrontendUrls
    if discussion:
        furl = FrontendUrls(discussion)

        def get_route(name, **kwargs):
            # If the resource is a furl_* route, check for front-end
            # routes first then return potential V2/V1 route
            # NOTE: `furl_` prefix MUST be used in this context in
            # order to avoid conflicts with Pyramid routes
            # This would NOT be true if only the FrontendUrl route is
            # used
            if 'furl_' in name:
                kwargs.update({'slug': discussion.slug})
                route_name = name.split('furl_')[1]
                route = furl.get_frontend_url(route_name, **kwargs)
                if route is not None:
                    return route

            if name == "bare_slug":
                name = "new_home" if discussion.preferences['landing_page'] \
                    else "home"
            try:
                return request.route_path('contextual_' + name,
                                          discussion_slug=discussion.slug,
                                          **kwargs)
            except KeyError:
                return request.route_path(
                    name, discussion_slug=discussion.slug, **kwargs)
    else:
        def get_route(name, **kwargs):
            # Front-end routes not under a discussion context is already
            # back-end aware
            kwargs['discussion_slug'] = kwargs.get('discussion_slug', '')
            return request.route_path(name, **kwargs)
    return get_route


def get_default_context(request, **kwargs):
    kwargs.update(default_context)
    from ..auth.util import get_user, get_current_discussion
    if request.scheme == "http"\
            and asbool(config.get("require_secure_connection")):
        raise HTTPFound(get_global_base_url(True) + request.path_qs)
    react_url = '/static2'
    use_webpack_server = asbool(config.get('use_webpack_server'))
    if use_webpack_server:
        # Allow to specify a distinct webpack_host in configuration.
        # Useful for development tests of social auth through a reverse tunnel.
        # Otherwise fallback on public_hostname, then localhost.
        webpack_host = config.get(
            'webpack_host',
            config.get('public_hostname',
                       'localhost'))
        react_url = 'http://%s:%d' % (
            webpack_host,
            int(config.get('webpack_port', 8000)))
    socket_proxied = asbool(config.get('changes_websocket_proxied'))
    websocket_port = None if socket_proxied \
        else config.get('changes_websocket_port')
    secure_socket = socket_proxied and (
        asbool(config.get("require_secure_connection")) or (asbool(config.get("accept_secure_connection")) and request.url.startswith('https:')))
    application_url = get_global_base_url()
    socket_url = get_global_base_url(
        secure_socket, websocket_port) + config.get('changes_prefix')

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

    web_analytics_piwik_script = config.get(
        'web_analytics_piwik_script') or False
    discussion = get_current_discussion()
    if (web_analytics_piwik_script and discussion and discussion.web_analytics_piwik_id_site):
        web_analytics_piwik_script = web_analytics_piwik_script % (
            discussion.web_analytics_piwik_id_site,
            discussion.web_analytics_piwik_id_site)
    else:
        web_analytics_piwik_script = False

    web_analytics_piwik_custom_variable_size = config.get('web_analytics_piwik_custom_variable_size')
    if not web_analytics_piwik_custom_variable_size:
        web_analytics_piwik_custom_variable_size = 5

    help_url = config.get('help_url') or ''
    if discussion and discussion.help_url:
        help_url = discussion.help_url
    if help_url and "%s" in help_url:
        help_url = help_url % localizer.locale_name

    first_login_after_auto_subscribe_to_notifications = False
    if (user and discussion and discussion.id and user.is_first_visit and
        discussion.subscribe_to_notifications_on_signup and
            user.is_participant(discussion.id)):
        first_login_after_auto_subscribe_to_notifications = True
    locales = config.get('available_languages').split()
    countries_for_locales = defaultdict(set)
    for locale in locales:
        countries_for_locales[get_language(locale)].add(get_country(locale))
    show_locale_country = {
        locale: (len(countries_for_locales[get_language(locale)]) > 1)
        for locale in locales}
    jedfilename = os.path.join(
        os.path.dirname(__file__), '..', 'locale',
        localizer.locale_name, 'LC_MESSAGES', 'assembl.jed.json')
    if not os.path.exists(jedfilename) and '_' in localizer.locale_name:
        jedfilename = os.path.join(
            os.path.dirname(__file__), '..', 'locale',
            get_language(localizer.locale_name), 'LC_MESSAGES',
            'assembl.jed.json')
    assert os.path.exists(jedfilename)

    from ..models.facebook_integration import language_sdk_existance
    fb_lang_exists, fb_locale = language_sdk_existance(
        get_language(localizer.locale_name), countries_for_locales)

    def process_export_list(ls):
        return map(lambda s: s.strip(), ls.split(","))

    social_settings = {
        'fb_export_permissions': config.get('facebook.export_permissions'),
        'fb_debug': asbool(config.get('facebook.debug_mode')),
        'fb_app_id': config.get('facebook.consumer_key'),
        'fb_api_version': config.get('facebook.api_version') or '2.2',
        'supported_exports': process_export_list(
            config.get('supported_exports_list'))
    }

    # A container for all analytics related settings. All future
    # analytics based settings that will be exposed to the templates
    # should be included in this dictionary
    analytics_settings = {
        'enabled': True if web_analytics_piwik_script else False,
    }

    if analytics_settings.get('enabled', False):
        analytics_settings['piwik'] = {
            'script': web_analytics_piwik_script,
            'host': config.get('piwik_host')
        }

    analytics_url = config.get('web_analytics_piwik_url', None)

    get_route = create_get_route(request, discussion)
    providers = get_provider_data(get_route)

    errors = request.session.pop_flash()
    if kwargs.get('error', None):
        errors.append(kwargs['error'])
    if errors:
        kwargs['error'] = '<br />'.join(errors)
    messages = request.session.pop_flash('message')
    if messages:
        kwargs['messages'] = '<br />'.join(messages)

    admin_email = config.get('assembl.admin_email', None)
    # If an admin_email is improperly configured, raise an error
    if admin_email is None or admin_email is '':
        raise HTTPInternalServerError(explanation="Assembl MUST have an admin_email configured in order to operate.")

    theme_name, theme_relative_path = get_theme_info(discussion)
    node_env = os.getenv('NODE_ENV', 'production')
    under_test = bool(config.get('under_test') or False)
    base = dict(
        kwargs,
        request=request,
        application_url=application_url,
        get_route=get_route,
        user=user,
        templates=get_template_views(),
        discussion=discussion or {},  # Templates won't load without a discussion object
        preferences=discussion.preferences if discussion else {},
        user_profile_edit_url=user_profile_edit_url,
        locale=localizer.locale_name,
        locales=locales,
        fb_lang_exists=fb_lang_exists,
        fb_locale=fb_locale,
        social_settings=social_settings,
        show_locale_country=show_locale_country,
        NODE_ENV=node_env,
        theme_name=theme_name,
        theme_relative_path=theme_relative_path,
        minified_js=config.get('minified_js') or False,
        web_analytics=analytics_settings,
        analytics_url=analytics_url,
        help_url=help_url,
        socket_url=socket_url,
        REACT_URL=react_url,
        elasticsearch_lang_indexes=config.get('elasticsearch_lang_indexes', 'en fr'),
        first_login_after_auto_subscribe_to_notifications=first_login_after_auto_subscribe_to_notifications,
        raven_url=config.get('raven_url') or '',
        activate_tour=str(config.get('activate_tour') or False).lower(),
        providers=providers,
        providers_json=json.dumps(providers),
        translations=io.open(jedfilename, encoding='utf-8').read(),
        admin_email=admin_email,
        under_test=under_test
    )

    base.update({
        "opengraph_locale": get_opengraph_locale(request),
        "get_description": get_description(request),
        "get_landing_page_image": get_landing_page_image(),
        "private_social_sharing": private_social_sharing(),
        "get_topic": get_topic(request),
        "get_discussion_url": get_discussion_url(),
        "discussion_title": discussion_title(),
    })

    return base


def get_discussion_url():
    from ..auth.util import get_current_discussion
    from assembl.lib.frontend_urls import FrontendUrls
    from assembl.lib.utils import get_global_base_url
    discussion = get_current_discussion()
    if discussion:
        front_end_urls = FrontendUrls(discussion)
        return front_end_urls.get_discussion_url()
    else:
        return get_global_base_url()


def private_social_sharing():
    """Returns true if the preference private_social_sharing is enabled. False otherwise"""
    from ..auth.util import get_current_discussion
    discussion = get_current_discussion()
    if discussion:
        return discussion.preferences["private_social_sharing"]
    else:
        return False


def get_opengraph_locale(request):
    """
    If there is a user logged in, returns his preferred locale
    If not, returns the first preferred locale of the discussion
    Otherwise, sets locale to fr
    """
    from ..auth.util import get_user, get_current_discussion
    from assembl.lib.locale import strip_country
    user = get_user(request)
    discussion = get_current_discussion()
    if not user and not discussion:
        locale = "fr"
    elif user:
        try:
            locale = user.language_preference[0].locale.code
            locale = strip_country(locale)
        except:
            if discussion:
                locale = discussion.preferences['preferred_locales'][0]
            else:
                locale = "fr"
    elif discussion and user is None:
        locale = discussion.preferences['preferred_locales'][0]
    return locale


def adapt_to_html_content(base):
    """Replaces the quotes inside the html content into @quot so that when rendered
    inside an html tag, it does not break the tag"""
    base.replace("\"", "&quot;")
    base.replace("<", "&lt;")
    base.replace(">", "&gt;")
    base.replace("&", "&amp;")
    return base


def get_description(request):
    """
    Returns the description corresponding to the locale returned from get_opengraph_locale
    If the discussion does not have a description corresponding to this locale,
    returns the description corresponding to the first preferred locale of the discussion
    """
    opengraph_locale = get_opengraph_locale(request)
    from ..auth.util import get_current_discussion
    discussion = get_current_discussion()
    if discussion:
        dict = discussion.preferences["extra_json"]
        objectives_dict = dict.get("objectives", "default objectives")
        if type(objectives_dict) == str:
            return adapt_to_html_content(objectives_dict)
        else:
            objectives_dict = objectives_dict["descriptionEntries"]
            locale = discussion.preferences['preferred_locales'][0]
            return adapt_to_html_content(objectives_dict.get(opengraph_locale, objectives_dict[locale]))


def get_topic(request):
    """
    Returns the topic corresponding to the locale returned from get_opengraph_locale
    If the discussion does not have a topic corresponding to this locale,
    returns the topic corresponding to the first preferred locale of the discussion
    """
    opengraph_locale = get_opengraph_locale(request)
    from ..auth.util import get_current_discussion
    discussion = get_current_discussion()
    if discussion:
        dict = discussion.preferences["extra_json"]
        topic_dict = dict.get("topic", "No topic available in the extra json")
        if type(topic_dict) == str:
            return adapt_to_html_content(topic_dict)
        else:
            topic_dict = topic_dict["titleEntries"]
            locale = discussion.preferences["preferred_locales"][0]
            return adapt_to_html_content(topic_dict.get(opengraph_locale, topic_dict[locale]))


def discussion_title():
    """Returns the title to be shown in the tab"""
    from ..auth.util import get_current_discussion
    discussion = get_current_discussion()
    if discussion:
        if discussion.preferences["tab_title"]:
            return discussion.preferences["tab_title"]
    return "Assembl"


def get_landing_page_image():
    """Returns landing page image of the discussion"""
    from ..auth.util import get_current_discussion
    discussion = get_current_discussion()
    if discussion:
        dict = discussion.preferences['extra_json']
        return dict.get("headerBackgroundUrl", "no image available")


def process_locale(
        locale_code, user, session, source_of_evidence):
    locale_code = to_posix_string(locale_code)
    # Updated: Now Locale is a model. Converting posix_string into its
    # equivalent model. Creates it if it does not exist
    locale = Locale.get_or_create(locale_code, session)

    if source_of_evidence in LanguagePreferenceOrder.unique_prefs:
        lang_pref_signatures = defaultdict(list)
        for lp in user.language_preference:
            lang_pref_signatures[lp.source_of_evidence].append(lp)
        while len(lang_pref_signatures[source_of_evidence]) > 1:
            # legacy multiple values
            lp = lang_pref_signatures[source_of_evidence].pop()
            lp.delete()
        if len(lang_pref_signatures[source_of_evidence]) == 1:
            lang_pref_signatures[source_of_evidence][0].locale = locale
            session.flush()
            return
        # else creation below
    else:
        lang_pref_signatures = {
            (lp.locale_id, lp.source_of_evidence)
            for lp in user.language_preference
        }
        if (locale.id, source_of_evidence) in lang_pref_signatures:
            return
    lang = UserLanguagePreference(
        user=user, source_of_evidence=source_of_evidence.value, locale=locale)
    session.add(lang)
    session.flush()


def get_locale_from_request(request, session=None, user=None):
    if user is None:
        user_id = request.authenticated_userid or Everyone
        if user_id != Everyone:
            user = User.get(user_id)
    session = session or User.default_db
    if user:
        if '_LOCALE_' in request.params:
            locale = request.params['_LOCALE_']
            process_locale(locale, user, session,
                           LanguagePreferenceOrder.Parameter)
        elif '_LOCALE_' in request.cookies:
            locale = request.cookies['_LOCALE_']
            process_locale(locale, user, session,
                           LanguagePreferenceOrder.Cookie)
        else:
            # uses my locale negotiator
            locale = request.locale_name
            process_locale(locale, user, session,
                           LanguagePreferenceOrder.OS_Default)
    else:
        locale = request.localizer.locale_name
    target_locale = Locale.get_or_create(
        strip_country(locale), session)
    return target_locale


def get_template_views():
    """ get all .tmpl files from templates/views directory """
    views_path = os.path.join(TEMPLATE_PATH, 'views')
    views = []

    for (dirpath, dirname, filenames) in os.walk(views_path):
        for filename in filenames:
            if filename.endswith('.tmpl'):
                views.append(filename.split('.')[0])

    return views


class JSONError(HTTPError):

    def __init__(self, detail=None, error_type=None,
                 code=HTTPBadRequest.code, headers=None, comment=None,
                 body_template=None, **kw):
        # error_type should be from .errors.ErrorTypes
        self.errors = []
        if detail:
            self.add_error(detail, error_type)
        super(JSONError, self).__init__(
            detail, headers, comment, **kw)

    @staticmethod
    def create_dict(message, error_type=None):
        if error_type:
            return dict(message=message, type=error_type.name)
        return dict(message=message)

    def add_error(self, message, error_type=None, code=None):
        self.errors.append(self.create_dict(message, error_type))
        if code is not None:
            self.code = code

    def __nonzero__(self):
        return bool(self.errors)


@view_config(context=HTTPError, renderer='assembl:templates/includes/404.jinja2')
def not_found(context, request):
    request.response.status = context.status_code
    return {"message": context.message, "code": context.status_code}


@view_config(context=JSONError, renderer='json')
def json_error_view(request):
    exc = request.exception
    request.response.status_code = exc.code
    return exc.errors


# TODO social.auth: Test the heck out of this.
@view_config(context=AuthMissingParameter)
def csrf_error_view(exc, request):
    if "HTTP_COOKIE" not in request.environ:
        user_agent = request.user_agent
        is_safari = 'Safari' in user_agent and 'Chrome' not in user_agent
        route_name = request.matched_route.name
        is_login_callback = (route_name == 'social.complete')
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
    return HTTPBadRequest(explanation="CSRF error", detail=repr(request.exception))


def error_view(exc, request):
    _ = TranslationStringFactory('assembl')
    error_code = exc.code.replace("f", "")
    capture_exception(getattr(request, "exc_info", None))
    context = get_default_context(request)
    return dict(
        context, debate_link="/", error_code=error_code,
        error=_("error"), 
        text=_("Our server has encountered a problem. The page you have requested is not accessible."),
        excuse=_("We apologize for the inconvenience"),
        home_button=_("Homepage")
    )

def error_template(request):
    context = get_default_context(request)
    return dict(
        context, debate_link="/", error_code="500",
        error="error", 
        text="Our server has encountered a problem. The page you have requested is not accessible.",
        excuse="We apologize for the inconvenience",
        home_button="Homepage"
    )

def redirector(request):
    return HTTPMovedPermanently(request.route_url(
        'home', discussion_slug=request.matchdict.get('discussion_slug')))


def sanitize_next_view(next_view):
    if next_view and ':/' in next_view:
        parsed = urlparse(next_view)
        if not parsed:
            return None
        if parsed.netloc != config.get("public_hostname"):
            return None
        if parsed.scheme == 'http':
            if asbool(config.get("require_secure_connection")):
                return None
        elif parsed.scheme == 'https':
            if not asbool(config.get("accept_secure_connection")):
                return None
        else:
            return None
    return next_view


def includeme(config):
    """ Initialize views and renderers at app start-up time. """

    settings = config.get_settings()

    config.add_renderer('json', json_renderer_factory)
    config.include('.traversal')

    default_discussion = settings.get('default_discussion', None)
    if default_discussion:
        config.add_route('discussion_list', '/discussions')
        config.add_view(
            lambda req: HTTPFound('/' + default_discussion),
            route_name='default_disc_redirect')

        config.add_route('default_disc_redirect', '/')
    else:
        config.add_route('discussion_list', '/')

    config.include(backbone_include, route_prefix='/debate/{discussion_slug}')
    config.include(legacy_backbone_include, route_prefix='/{discussion_slug}')

    if asbool(config.get_settings().get('assembl_handle_exceptions', 'true')):
        config.add_view(error_view, context=Exception,
                        renderer='assembl:templates/error_page.jinja2')

    # View for error template in development environment only
    if os.getenv('NODE_ENV') == "development":
        config.add_route('error_template', '/error_template')
        config.add_view(error_template, route_name='error_template',
                        renderer='assembl:templates/error_page.jinja2')

    #  authentication
    config.include('.auth')

    config.include('.api')
    config.include('.api2')
    config.include('.admin')
    config.include('.search')

    config.add_route('home-auto', '/debate/{discussion_slug}/')
    config.add_route('home', '/debate/{discussion_slug}')

    def redirector(request):
        return HTTPMovedPermanently(request.route_url('home', discussion_slug=request.matchdict.get('discussion_slug')))
    config.add_view(redirector, route_name='home-auto')
    default_context['cache_bust'] = \
        config.registry.settings['requirejs.cache_bust']

    # Scan now, to get cornice views
    config.scan('.')
    config.include('.discussion')  # Must be last routes to be called
