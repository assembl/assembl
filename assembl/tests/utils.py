import logging
import sys
from itertools import chain

import transaction
from sqlalchemy.sql.functions import count

from ..lib.sqla import (
    configure_engine, get_session_maker, using_virtuoso,
    get_metadata, is_zopish, mark_changed)


log = logging.getLogger('pytest.assembl')


def as_boolean(s):
    if isinstance(s, bool):
        return s
    return str(s).lower() in ['true', '1', 'on', 'yes']


def get_all_tables(app_settings, session, reversed=True):
    schema = app_settings.get('db_schema', 'assembl_test')
    # TODO: Quote schema name!
    res = session.execute(
        "SELECT table_name FROM "
        "information_schema.tables WHERE table_schema = "
        "'%s' ORDER BY table_name" % (schema,)).fetchall()
    res = {row[0] for row in res}
    # get the ordered version to minimize cascade.
    # cascade does not exist on virtuoso.
    import assembl.models
    ordered = [t.name for t in get_metadata().sorted_tables
               if t.name in res]
    ordered.extend([t for t in res if t not in ordered])
    if reversed:
        ordered.reverse()
    log.debug('Current tables: %s' % str(ordered))
    return ordered


def self_referential_columns(table):
    return [fk.parent for fk in chain(*[
                c.foreign_keys for c in table.columns])
            if fk.column.table == table]


def clear_rows(app_settings, session):
    log.info('Clearing database rows.')
    tables_by_name = {
        t.name: t for t in get_metadata().sorted_tables}
    for table_name in get_all_tables(app_settings, session):
        log.debug("Clearing table: %s" % table_name)
        table = tables_by_name.get(table_name, None)
        if table is not None:
            cols = self_referential_columns(table)
            if len(cols):
                for col in cols:
                    session.execute("UPDATE %s SET %s=NULL" % (table_name, col.key))
                session.flush()
        session.execute("DELETE FROM \"%s\"" % table_name)
    session.commit()
    session.transaction.close()


def drop_tables(app_settings, session):
    log.info('Dropping all tables.')
    if not using_virtuoso():
        # postgres. Thank you to
        # http://stackoverflow.com/questions/5408156/how-to-drop-a-postgresql-database-if-there-are-active-connections-to-it
        session.close()
        session.execute(
            """SELECT pg_terminate_backend(pg_stat_activity.pid)
                FROM pg_stat_activity
                WHERE pg_stat_activity.datname = '%s'
                  AND pid <> pg_backend_pid()""" % (
                    app_settings.get("db_database")))

    try:
        for row in get_all_tables(app_settings, session):
            log.debug("Dropping table: %s" % row)
            session.execute("drop table \"%s\"" % row)
        mark_changed()
    except:
        raise Exception('Error dropping tables: %s' % (
            sys.exc_info()[1]))
