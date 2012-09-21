""" Pyramid add start-up module. """

from pyramid.config import Configurator


def main(global_config, **settings):
    """ Return a Pyramid WSGI application. """
    settings['config_uri'] = global_config['__file__']

    config = Configurator(settings=settings)
    config.include('cornice')  # REST services library.
    config.include('.lib.sqla')
    config.include('.lib.alembic')
    config.include('.lib.email')
    config.include('.views')

    config.scan('.lib')
    config.scan('.views')

    return config.make_wsgi_app()
