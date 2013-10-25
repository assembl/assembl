""" Wrapper over the command line migrate tool to better work with
config files. """

import subprocess
import sys

from pyramid.paster import get_appsettings
import transaction
from alembic.migration import MigrationContext

from ..lib.migration import bootstrap_db
from ..lib.sqla import configure_engine, mark_changed


def main():
    if len(sys.argv) < 3:
        sys.stderr.write('Usage: %s CONFIG_URI {bootstrap | ALEMBIC_OPTS}\n'
                         % sys.argv[0])
        sys.exit(1)

    config_uri = sys.argv.pop(1)

    if sys.argv[1] == 'bootstrap':
        settings = get_appsettings(config_uri)
        engine = configure_engine(settings, True)
        bootstrap_db(config_uri)
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
