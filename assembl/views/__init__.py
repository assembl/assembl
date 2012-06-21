""" App URL routing is configured in this module. """


def includeme(config):
    config.include(api, route_prefix='/api')


def api(config):
    config.include(api_post, route_prefix='/post')


def api_post(config):
    _add = config.add_route

    _add('api.post.list', 'list')
    _add('api.post.create', 'create')
    _add('api.post.get', 'get/{id}')
    _add('api.post.update', 'update/{id}')
    _add('api.post.delete', 'delete/{id}')
