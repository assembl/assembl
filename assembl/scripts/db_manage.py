""" Wrapper over the command line migrate tool to better work with
config files. """
#To test:  python -m assembl.scripts.db_manage
import argparse
import subprocess
import sys
import os
import time

from pyramid.paster import get_appsettings
import transaction
from sqlalchemy import create_engine as create_engine_sqla
from alembic.migration import MigrationContext

from ..lib.migration import bootstrap_db, bootstrap_db_data
from ..lib.sqla import configure_engine, mark_changed
from ..lib.zmqlib import configure_zmq
from ..lib.config import set_config
from sqlalchemy.orm import sessionmaker

init_instructions = [
    "user_create('%(db_user)s', '%(db_password)s')",
    "grant select on db..tables to %(db_user)s",
    "grant select on db..sys_users to %(db_user)s",
    "grant select on db..sys_cluster to  %(db_user)s",
    "db..user_set_qualifier ('%(db_user)s', '%(db_schema)s')"]


def main():
    parser = argparse.ArgumentParser(description="Manage database bootstrap, backup and update.")
    parser.add_argument("configuration", help="configuration file")
    parser.add_argument("command", help="command",  choices=['bootstrap', 'backup', 'alembic'])
    parser.add_argument('alembic_args', nargs='*')
    args = parser.parse_args()
    settings = get_appsettings(args.configuration, 'assembl')
    set_config(settings)
    configure_zmq(settings['changes.socket'], False)
    engine = configure_engine(settings, True)
    admin_engine = create_engine_sqla('virtuoso://dba:dba@VOSU')
    if args.command == "bootstrap":
        
        SessionMaker = sessionmaker(admin_engine)
        session = SessionMaker()
        if not session.execute(
                "select count(*) from db..sys_users"
                " where u_name = '%(db_user)s'" % settings).scalar():
            for i in init_instructions:
                session.execute(i % settings)
            session.commit()
        db = bootstrap_db(args.configuration)
        bootstrap_db_data(db)
        mark_changed()
        transaction.commit()

    elif args.command == "backup":
        admin_engine.execute("backup_context_clear()")
        
        filename_prefix = 'assembl-virtuoso-backup' # % time.strftime('%Y%m%d%H%M%S')
        #virtuoso will add this suffix to the filename no matter what we do
        virtuoso_suffix = "1.bp"
        # Unfortunately adding , 3600, vector('"+os.getcwd()+"') typically
        # doesn't work as forbidden by default virtuoso configuration.
        admin_engine.execute("backup_online('"+filename_prefix+"', 524288)")
        
        sys.stdout.write(filename_prefix+virtuoso_suffix+'\n')
    elif args.command == "alembic":
        context = MigrationContext.configure(engine.connect())
        db_version = context.get_current_revision()

        if not db_version:
            sys.stderr.write('Database not initialized.\n'
                             'Try this: "assembl-db-manage %s bootstrap"\n'
                             % args.configuration)
            sys.exit(2)

        cmd = ['alembic', '-c', args.configuration] + args.alembic_args

        print(subprocess.check_output(cmd))
            
if __name__ == '__main__':
    main()
