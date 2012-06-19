from pyramid.config import Configurator
from sqlalchemy import engine_from_config

from .lib.json import json_renderer_factory
from .migrate import ensure_db_version
from .models import DBSession


def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """
    engine = engine_from_config(settings, 'sqlalchemy.')
    DBSession.configure(bind=engine)
    ensure_db_version(global_config)

    config = Configurator(settings=settings)
    config.add_renderer('json', json_renderer_factory)
    config.add_static_view('static', 'static', cache_max_age=3600)
    config.add_route('home', '/')
    config.scan()
    return config.make_wsgi_app()

