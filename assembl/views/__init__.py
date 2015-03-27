""" App URL routing and renderers are configured in this module. """

import os.path
import json
import codecs
from pyramid.security import Allow, ALL_PERMISSIONS, DENY_ALL
from pyramid.httpexceptions import (
    HTTPException, HTTPNotFound, HTTPInternalServerError)
from pyramid.i18n import TranslationStringFactory

from ..lib.json import json_renderer_factory
from ..lib import config
from ..auth import R_SYSADMIN

default_context = {
    'STATIC_URL': '/static'
}

TEMPLATE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'templates')

def backbone_include(config):
    from ..lib.frontend_urls import FrontendUrls
    FrontendUrls.register_frontend_routes(config)
    config.add_route('styleguide', '/styleguide')
    config.add_route('test', '/test')
    config.add_route('graph_view', '/graph')
    config.add_route('home', '/')


def get_theme(discussion_slug):
    import pdb; pdb.set_trace()
    theme_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'css', 'themes')
    default_theme = config.get('default_theme') or 'default'
    default_folder = os.path.realpath(os.path.join(theme_path, default_theme))
    if not discussion_slug:
        return default_theme
    try:
        slug_file = os.path.realpath(os.path.join(theme_path, discussion_slug))
        if os.path.isdir(slug_file):
            return discussion_slug
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
    discussion_title = None
    discussion_slug = None
    if discussion:
        discussion_title = discussion.topic
        discussion_slug = discussion.slug
    if web_analytics_piwik_script and discussion and discussion.web_analytics_piwik_id_site:
        web_analytics_piwik_script = web_analytics_piwik_script % ( discussion.web_analytics_piwik_id_site, discussion.web_analytics_piwik_id_site )
    else:
        web_analytics_piwik_script = False

    first_login_after_auto_subscribe_to_notifications = False
    # FIXME: user.is_first_visit does not seem to work, as it is always false, to right now first_login_after_auto_subscribe_to_notifications can never become True and so the popin can never be shown
    if user and discussion and discussion.id and user.is_first_visit and discussion.subscribe_to_notifications_on_signup:
        # set session variable, so that we show the popin only once in the session
        # TODO: use a different flag for each discussion, so that if the user joins several auto-subscribing discussions during the same logged-in session, we show one popin for every discussion
        if not request.session.get('first_login_after_auto_subscribe_to_notifications_popin_has_been_shown', False):
            request.session['first_login_after_auto_subscribe_to_notifications_popin_has_been_shown'] = True
            first_login_after_auto_subscribe_to_notifications = True

    return dict(
        default_context,
        request=request,
        user=user,
        templates=get_template_views(),
        discussion={},  # Templates won't load without a discussion object
        discussion_title=discussion_title,
        discussion_slug=discussion_slug,
        user_profile_edit_url=user_profile_edit_url,
        locale=localizer.locale_name,
        locales=config.get('available_languages').split(),
        theme=get_theme(discussion_slug),
        minified_js=config.get('minified_js') or False,
        web_analytics_piwik_script=web_analytics_piwik_script,
        first_login_after_auto_subscribe_to_notifications=first_login_after_auto_subscribe_to_notifications,
        raven_url=config.get('raven_url') or '',
        translations=codecs.open(os.path.join(
            os.path.dirname(__file__), '..', 'locale',
            localizer.locale_name, 'LC_MESSAGES', 'assembl.jed.json'),
        encoding='utf-8').read()
        #TODO:  batch strip json not from js files
        #translations=json.dumps({
        #    id:localizer.translate(_(id)) for id in JS_MESSAGE_IDS}))
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


def includeme(config):
    """ Initialize views and renderers at app start-up time. """

    config.add_renderer('json', json_renderer_factory)
    config.include('.traversal')
    config.add_route('discussion_list', '/')

    config.include(backbone_include, route_prefix='/{discussion_slug}')

    #  authentication
    config.include('.auth')

    config.include('.api')
    config.include('.api2')

    config.include('.home')
    config.include('.admin')
    default_context['socket_url'] = \
        config.registry.settings['changes.websocket.url']
    default_context['cache_bust'] = \
        config.registry.settings['requirejs.cache_bust']
