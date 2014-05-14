""" App URL routing and renderers are configured in this module. """

import os.path
import json
from pyramid.security import Allow, ALL_PERMISSIONS, DENY_ALL
from pyramid.httpexceptions import HTTPNotFound, HTTPInternalServerError
from pyramid.i18n import get_localizer, TranslationStringFactory

from ..lib.json import json_renderer_factory
from ..lib import config
from ..auth import R_SYSADMIN
from ..auth.util import get_user

default_context = {
    'STATIC_URL': '/static/'
}


def backbone_include(config):
    config.add_route('home', '/')
    config.add_route('home_idea', '/idea/{idea_id}')
    config.add_route('home_idea_slug', '/idea/{idea_slug}/{idea_id}')
    config.add_route('home_message', '/message/{message_id}')
    config.add_route('home_message_slug', '/message/{message_slug}/{message_id}')
    config.add_route('toc', '/toc')
    config.add_route('nodetest', '/nodetest')
    config.add_route('styleguide', '/styleguide')
    config.add_route('test', '/test')
    config.add_route('graph_view', '/graph')


def js_message_ids():
    from babel.messages.pofile import read_po
    pot = read_po(open(os.path.join(os.path.dirname(__file__), '..', 'locale', 'assembl.pot')))
    def is_js(msg):
        for (filename, lineno) in msg.locations:
            if filename.endswith('.js'):
                return True
    return [m.id for m in pot if is_js(m)]

JS_MESSAGE_IDS = js_message_ids()

def get_default_context(request):
    localizer = get_localizer(request)
    _ = TranslationStringFactory('assembl')
    user=get_user(request)
    if user:
        user_profile_edit_url = request.route_url('profile',type='u',identifier=user.username.username)
    else:
        user_profile_edit_url = None
    return dict(default_context,
        request=request,
        user=user,
        user_profile_edit_url=user_profile_edit_url,
        locale=localizer.locale_name,
        locales=config.get('available_languages').split(),
        theme=config.get('default_theme') or 'default',
        translations=json.dumps({
            id:localizer.translate(_(id)) for id in JS_MESSAGE_IDS}))


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
