""" App URL routing and renderers are configured in this module. """

from ..lib.json import json_renderer_factory


def includeme(config):
    """ Initialize views and renderers at app start-up time. """
    config.add_renderer('json', json_renderer_factory)
    config.add_static_view('static', 'static', cache_max_age=3600)
    config.include(api_urls, route_prefix='/api')


def api_urls(config):
    config.include(api_post_urls, route_prefix='/post')


def api_post_urls(config):
    _add = config.add_route

    _add('api.post.list', 'list')
    _add('api.post.create', 'create')
    _add('api.post.get', 'get/{id}')
    _add('api.post.update', 'update/{id}')
    _add('api.post.delete', 'delete/{id}')
