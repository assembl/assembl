""" App URL routing and renderers are configured in this module. """

import os.path
import json
import codecs
from pyramid.security import Allow, ALL_PERMISSIONS, DENY_ALL
from pyramid.httpexceptions import HTTPNotFound, HTTPInternalServerError
from pyramid.i18n import TranslationStringFactory

from ..lib.json import json_renderer_factory
from ..lib import config
from ..auth import R_SYSADMIN

default_context = {
    'STATIC_URL': '/static'
}

TEMPLATE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'templates')

def backbone_include(config):
    config.add_route('home', '/')
    config.add_route('edition', '/edition')
    config.add_route('partners', '/partners')
    config.add_route('slug_notifications', '/notifications')

    config.add_route('profile', '/users/edit')
    config.add_route('user_notifications', '/users/notifications')

    config.add_route('nodetest', '/nodetest')
    config.add_route('styleguide', '/styleguide')
    config.add_route('test', '/test')
    config.add_route('graph_view', '/graph')

def get_default_context(request):
    from ..auth.util import get_user
    localizer = request.localizer
    _ = TranslationStringFactory('assembl')
    user=get_user(request)
    if user and user.username:
        user_profile_edit_url = request.route_url('profile_user',type='u',identifier=user.username.username)
    else:
        user_profile_edit_url = None
    return dict(default_context,
        request=request,
        user=user,
        templates= get_template_views(),
        discussion={},  # Templates won't load without a discussion object
        user_profile_edit_url=user_profile_edit_url,
        locale=localizer.locale_name,
        locales=config.get('available_languages').split(),
        theme=config.get('default_theme') or 'default',
        minified_js=config.get('minified_js') or False,
        translations=codecs.open(os.path.join(os.path.dirname(__file__), '..', 'locale', localizer.locale_name, 'LC_MESSAGES', 'assembl.jed.json'), encoding='utf-8').read()
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
