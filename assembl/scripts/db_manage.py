""" Wrapper over the command line migrate tool to better work with
config files. """

import subprocess
import sys

from pyramid.paster import get_appsettings
import transaction
from sqlalchemy import create_engine as create_engine_sqla
from alembic.migration import MigrationContext

from ..lib.migration import bootstrap_db, bootstrap_db_data
from ..lib.sqla import configure_engine, mark_changed
from ..lib.zmqlib import configure_zmq
from sqlalchemy.orm import sessionmaker

init_instructions = [
    "user_create('%(db_user)s', '%(db_password)s')",
    "grant select on db..tables to %(db_user)s",
    "grant select on db..sys_users to %(db_user)s",
    "db..user_set_qualifier ('%(db_user)s', '%(db_schema)s')"]


def main():
    if len(sys.argv) < 3:
        sys.stderr.write('Usage: %s CONFIG_URI {bootstrap | ALEMBIC_OPTS}\n'
                         % sys.argv[0])
        sys.exit(1)

    config_uri = sys.argv.pop(1)

    settings = get_appsettings(config_uri)
    configure_zmq(settings['changes.socket'], False)
    engine = configure_engine(settings, True)
    if sys.argv[1] == 'bootstrap':
        admin_engine = create_engine_sqla('virtuoso://dba:dba@VOSU')
        SessionMaker = sessionmaker(admin_engine)
        session = SessionMaker()
        if not session.execute(
                "select count(*) from db..sys_users"
                " where u_name = '%(db_user)s'" % settings).scalar():
            for i in init_instructions:
                session.execute(i % settings)
            session.commit()
        db = bootstrap_db(config_uri)
        bootstrap_db_data(db)
        mark_changed()
        transaction.commit()
    else:
        context = MigrationContext.configure(engine.connect())
        db_version = context.get_current_revision()

        if not db_version:
            sys.stderr.write('Database not initialized.\n'
                             'Try this: "assembl-db-manage %s bootstrap"\n'
                             % config_uri)
            sys.exit(2)

        cmd = ['alembic', '-c', config_uri] + sys.argv[1:]

        print(subprocess.check_output(cmd))
