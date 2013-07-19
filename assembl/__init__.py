""" Pyramid add start-up module. """

from pyramid.config import Configurator
from sqlalchemy import engine_from_config

from .db import DBSession


def main(global_config, **settings):
    """ Return a Pyramid WSGI application. """
    settings['config_uri'] = global_config['__file__']

    # here we create the engine and bind it to the (not really a) session
    # factory called DBSession.
    engine = engine_from_config(settings, 'sqlalchemy.')
    DBSession.configure(bind=engine)

    config = Configurator(settings=settings)
    config.add_static_view('static', 'static', cache_max_age=3600)
    config.include('cornice')  # REST services library.
    # config.include('.lib.alembic')
    # config.include('.lib.email')
    # config.include('.views')

    # config.scan('.lib')
    # config.scan('.views')

    # jinja2
    config.include('pyramid_jinja2')

    return config.make_wsgi_app()
