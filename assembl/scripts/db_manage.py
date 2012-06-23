""" Wrapper over the command line migrate tool to better work with
config files. """

import subprocess
import sys

from alembic.migration import MigrationContext

from ..lib.alembic import bootstrap_db
from ..lib.sautils import create_engine
from ..models import DBSession as db


def main():
    if len(sys.argv) < 3:
        sys.stderr.write('Usage: %s CONFIG_URI {bootstrap | ALEMBIC_OPTS}\n'
                         % sys.argv[0])
        sys.exit(1)

    config_uri = sys.argv.pop(1)

    if sys.argv[1] == 'bootstrap':
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
