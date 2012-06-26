from pyramid.config import Configurator
from sqlalchemy import engine_from_config

from . import views
from .lib import email
from .lib.alembic import ensure_db_version
from .lib.json import json_renderer_factory
from .models import DBSession as db


def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """
    email.patch_stdlib()

    engine = engine_from_config(settings, 'sqlalchemy.')
    db.configure(bind=engine)
    ensure_db_version(global_config, engine)

    config = Configurator(settings=settings)
    config.add_renderer('json', json_renderer_factory)
    config.add_static_view('static', 'static', cache_max_age=3600)
    config.include(views)
    config.scan('.lib')
    config.scan('.views')
    return config.make_wsgi_app()
