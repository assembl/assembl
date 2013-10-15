""" Wrapper over the command line migrate tool to better work with
config files. """

import subprocess
import sys

from alembic.migration import MigrationContext

from ..lib.migration import bootstrap_db
from ..lib.sqla import create_engine, DBSession as db
from sqlalchemy import create_engine as create_engine_sqla
from sqlalchemy.orm import sessionmaker

init_instructions = [
    "user_create('assembl', 'assembl')",
    "grant select on db..tables to assembl",
    "grant select on db..sys_users to assembl",
    "db..user_set_qualifier ('assembl', 'assembl')"]


def main():
    if len(sys.argv) < 3:
        sys.stderr.write('Usage: %s CONFIG_URI {bootstrap | ALEMBIC_OPTS}\n'
                         % sys.argv[0])
        sys.exit(1)

    config_uri = sys.argv.pop(1)

    if sys.argv[1] == 'bootstrap':
        admin_engine = create_engine_sqla('virtuoso://dba:dba@VOSU')
        SessionMaker = sessionmaker(admin_engine)
        session = SessionMaker()
        if not session.execute(
                "select count(*) from db..sys_users"
                " where u_name = 'assembl'").scalar():
            for i in init_instructions:
                session.execute(i)
            session.commit()
        bootstrap_db(config_uri)
    else:
        engine = create_engine(config_uri)
        db.configure(bind=engine)
        context = MigrationContext.configure(engine.connect())
        db_version = context.get_current_revision()

        if not db_version:
            sys.stderr.write('Database not initialized.\n'
                             'Try this: "assembl-db-manage %s bootstrap"\n'
                             % config_uri)
            sys.exit(2)

        cmd = ['alembic', '-c', config_uri] + sys.argv[1:]

        print(subprocess.check_output(cmd))
