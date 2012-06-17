from pyramid.config import Configurator
from sqlalchemy import engine_from_config

from .alembic import ensure_db_version
from .models import DBSession as db


def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """
    engine = engine_from_config(settings, 'sqlalchemy.')
    db.configure(bind=engine)
    ensure_db_version(global_config, engine)

    config = Configurator(settings=settings)
    config.add_static_view('static', 'static', cache_max_age=3600)
    config.add_route('home', '/')
    config.scan('.lib')
    return config.make_wsgi_app()
