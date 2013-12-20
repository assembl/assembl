""" App URL routing and renderers are configured in this module. """

from pyramid.security import Allow, ALL_PERMISSIONS
from pyramid.httpexceptions import HTTPNotFound, HTTPInternalServerError

from ..lib.json import json_renderer_factory


def backbone_include(config):
    config.add_route('home', '/')
    config.add_route('home_idea', '/idea/{idea_id}')
    config.add_route('home_message', '/message/{message_id}')
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
    config.include('.backbone')
    config.include('.admin')
