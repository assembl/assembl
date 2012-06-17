import sys

from alembic import command
from alembic.config import Config
from alembic.migration import MigrationContext
from alembic.script import ScriptDirectory
import transaction

from ..models import DBSession as db, metadata, MyModel
from ..models.sautils import create_engine


def bootstrap_db(config_uri):
    """ Bring a blank database to a functional state. """
    engine = create_engine(config_uri)
    db.configure(bind=engine)
    context = MigrationContext.configure(engine.connect())
    db_version = context.get_current_revision()

    if db_version:
        sys.stderr.write('Database already initialized. Bailing out.\n')
        sys.exit(2)

    config = Config(config_uri)
    script_dir = ScriptDirectory.from_config(config)
    heads = script_dir.get_heads()

    if len(heads) > 1:
        sys.stderr.write('Error: migration scripts have more than one head.\n'
                         'Please resolve the situation before attempting to'
                         'bootstrap the database.\n')
        sys.exit(2)

    metadata.create_all(engine)

    with transaction.manager:
        model = MyModel(name='one', value=1)
        db.add(model)

    if heads:
        command.stamp(config, 'head')


def ensure_db_version(global_config, engine):
    """ Exit if database is not up-to-date. """
    config = Config(global_config['__file__'])
    script_dir = ScriptDirectory.from_config(config)
    heads = script_dir.get_heads()

    if len(heads) > 1:
        sys.stderr.write('Error: migration scripts have more than one head.\n'
                         'Please resolve the situation before attempting to '
                         'start the application.\n')
        sys.exit(2)
    else:
        repo_version = heads[0] if heads else None

    context = MigrationContext.configure(engine.connect())
    db_version = context.get_current_revision()

    if not db_version:
        sys.stderr.write('Database not initialized.\n'
                         'Try this: "assembl-db-manage %s bootstrap".\n'
                         % global_config['__file__'])
        sys.exit(2)

    if db_version != repo_version:
        sys.stderr.write('Stopping: DB version (%s) not up-to-date (%s).\n'
                         % (db_version, repo_version))
        sys.stderr.write('Try this: "assembl-db-manage %s upgrade head".\n'
                         % global_config['__file__'])
        sys.exit(2)
