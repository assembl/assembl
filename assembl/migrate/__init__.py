import os
import sys

from migrate.exceptions import DatabaseNotControlledError
from migrate.versioning.schema import ControlledSchema, Repository

from ..models import DBSession


def ensure_db_version(global_config):
    repository = Repository(os.path.dirname(__file__))
    try:
        schema = ControlledSchema(DBSession.get_bind(), repository)
        if repository.latest != schema.version:
            sys.stderr.write('Stopping: db version (%d) not up-to-date (%s).\n'
                             % (schema.version, repository.latest))
            sys.stderr.write('Try this: "assembl-db-manage %s upgrade"\n'
                             % global_config['__file__'])
            sys.exit(2)
    except DatabaseNotControlledError as e:
        sys.stderr.write('Database not initialized.\n')
        sys.stderr.write('Try this: "assembl-db-manage %s init"\n'
                         % global_config['__file__'])
        sys.exit(2)
