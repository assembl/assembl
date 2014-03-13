""" App URL routing and renderers are configured in this module. """

import os.path

import json
from pyramid.security import Allow, ALL_PERMISSIONS
from pyramid.httpexceptions import HTTPNotFound, HTTPInternalServerError
from pyramid.i18n import get_localizer, TranslationStringFactory

from ..lib.json import json_renderer_factory
from ..lib import config
from assembl.auth import get_user, P_READ

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


class _DefaultRoot(object):
    def __init__(self, sysadmrole):
        self.__acl__ = [(Allow, sysadmrole, ALL_PERMISSIONS)]
    __parent__ = None
    __name__ = "Assembl"


def root_factory(request):
    from ..models import Discussion
    if request.matchdict and 'discussion_id' in request.matchdict:
        discussion_id = int(request.matchdict['discussion_id'])
        discussion = Discussion.db.query(Discussion).get(discussion_id)
        if not discussion:
            raise HTTPNotFound("No discussion ID %d" % (discussion_id,))
        return discussion
    elif request.matchdict and 'discussion_slug' in request.matchdict:
        discussion_slug = request.matchdict['discussion_slug']
        discussion = Discussion.db.query(Discussion).filter_by(
            slug=discussion_slug).first()
        if not discussion:
            raise HTTPNotFound("No discussion named %s" % (discussion_slug,))
        return discussion
    from ..auth.models import R_SYSADMIN
    return _DefaultRoot(R_SYSADMIN)


def acls(request):
    return root_factory(request).__acl__


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

    return dict(default_context,
        user=get_user(request),
        locale=localizer.locale_name,
        locales=config.get('available_languages').split(),
        translations=json.dumps({
            id:localizer.translate(_(id)) for id in JS_MESSAGE_IDS}))


def includeme(config):
    """ Initialize views and renderers at app start-up time. """

    config.add_renderer('json', json_renderer_factory)
    config.add_route('discussion_list', '/')

    config.include(backbone_include, route_prefix='/{discussion_slug}')

    #config.include(api_urls, route_prefix='/api')

    #  authentication
    config.include('.auth')

    config.include('.api')

    config.include('.home')
    config.include('.admin')
    default_context['socket_url'] = \
        config.registry.settings['changes.websocket.url']
    default_context['cache_bust'] = \
        config.registry.settings['requirejs.cache_bust']
