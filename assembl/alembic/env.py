from __future__ import with_statement

from logging.config import fileConfig

from alembic import context

from pyramid.paster import bootstrap

from assembl.lib.sqla import (
    get_session_maker, configure_engine, get_metadata)
from assembl.lib.zmqlib import configure_zmq
from assembl.lib.config import set_config
from assembl.indexing.changes import configure_indexing
from assembl.lib.migration import bootstrap_db_data

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
fileConfig(config.config_file_name)
_config = config.file_config._sections['app:assembl']
_config['in_migration'] = True
set_config(_config)
pyramid_env = bootstrap(config.config_file_name)
configure_zmq(pyramid_env['registry'].settings['changes_socket'], False)
configure_engine(pyramid_env['registry'].settings, False)
configure_indexing()


def run_migrations_online():
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    session_maker = get_session_maker()
    engine = session_maker.bind
    connection = engine.connect()
    context.configure(connection=connection,
                      target_metadata=get_metadata())

    try:
        context.run_migrations(pyramid_env=pyramid_env)
        # bootstrap_db_data(session_maker)
    finally:
        connection.close()


def run_migrations_offline():
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url)

    with context.begin_transaction():
        context.run_migrations(pyramid_env=pyramid_env)
        session_maker = get_session_maker()
        # bootstrap_db_data(session_maker)

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
