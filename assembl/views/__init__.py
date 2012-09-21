""" App URL routing and renderers are configured in this module. """

from ..lib.json import json_renderer_factory


# We can't create cornice services here, but at least we can build URI paths.
# They will be used in the respective view modules to create the cornice
# services.
cornice_paths = dict()


def includeme(config):
    """ Initialize views and renderers at app start-up time. """
    config.add_renderer('json', json_renderer_factory)
    config.add_static_view('static', 'static', cache_max_age=3600)
    config.include(api_urls, route_prefix='/api')


def api_urls(config):
    config.include(api_post_urls, route_prefix='/posts')


def api_post_urls(config):
    global cornice_paths
    cornice_paths['posts'] = config.route_prefix
    cornice_paths['post'] = '%s/{id}' % config.route_prefix
