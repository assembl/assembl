""" App URL routing and renderers are configured in this module. """

from ..lib.json import json_renderer_factory


def backbone_include(config):
    config.add_route('home', '/')
    config.add_route('toc', '/toc')
    config.add_route('nodetest', '/nodetest')
    config.add_route('styleguide', '/styleguide')
    config.add_route('test', '/test')
    
def includeme(config):
    """ Initialize views and renderers at app start-up time. """

    config.add_renderer('json', json_renderer_factory)
    config.add_route('discussion_list', '/')
    config.add_route('discussion_admin', '/admin/discussions/')
    
    config.include(backbone_include, route_prefix='/{discussion_slug}')

    #config.include(api_urls, route_prefix='/api')

    #  authentication
    config.include('.auth')

