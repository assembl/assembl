""" Wrapper over the command line migrate tool to better work with
config files. """

import os
import sys

from migrate.exceptions import DatabaseNotControlledError
from migrate.versioning.shell import main as _main

from pyramid.paster import get_appsettings

from .. import migrate
from ..models.bootstrap import db_init


def main():
    if len(sys.argv) < 3:
        sys.stderr.write('Usage: %s CONFIG_URI init|MIGRATE_OPTS\n'
                         % sys.argv[0])
        sys.exit(1)

    config_uri = sys.argv.pop(1)
    if sys.argv[1] == 'init':
        db_init(config_uri)
    else:
        try:
            settings = get_appsettings(config_uri)
            repository = os.path.dirname(migrate.__file__)
            _main(repository=repository, url=settings['sqlalchemy.url'])
        except DatabaseNotControlledError as e:
            sys.stderr.write('Database not initialized.\n')
            sys.stderr.write('Try this: "assembl-db-manage %s init"\n'
                             % config_uri)
            sys.exit(2)
