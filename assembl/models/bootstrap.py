""" Database initialization-related utilities. """

import os
import sys
import transaction

from migrate.exceptions import DatabaseAlreadyControlledError
from migrate.versioning.schema import ControlledSchema, Repository
from sqlalchemy import engine_from_config

from pyramid.paster import get_appsettings, setup_logging

from .. import migrate
from ..models import Base, DBSession, MyModel, TimestampedBase


def db_init(config_uri):
    setup_logging(config_uri)
    settings = get_appsettings(config_uri)
    engine = engine_from_config(settings, 'sqlalchemy.')
    DBSession.configure(bind=engine)

    # Initialize sqlalchemy-migrate.
    try:
        repository = Repository(os.path.dirname(migrate.__file__))
        ControlledSchema.create(engine, repository, repository.latest)
    except DatabaseAlreadyControlledError as e:
        sys.stderr.write('Database already initialized. Bailing out.\n')
        sys.exit(2)

    Base.metadata.create_all(engine)
    TimestampedBase.metadata.create_all(engine)

    with transaction.manager:
        model = MyModel(name='one', value=1)
        DBSession.add(model)
