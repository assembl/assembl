"""Clone all data from a database to another. Mostly useful for database migration."""
import argparse
import logging.config
import traceback
import pdb

from sqlalchemy import (
    Table, Column, String, insert, select, delete, create_engine, update)
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql.expression import cast
from sqlalchemy.types import TIMESTAMP, DATETIME
from pyramid.paster import get_appsettings, bootstrap

from assembl.lib.config import set_config
from assembl.lib.sqla import (
    configure_engine, get_session_maker, make_session_maker, get_metadata)
from assembl.lib.zmqlib import configure_zmq
from assembl.lib.model_watcher import configure_model_watcher
from assembl.indexing.changes import configure_indexing


recursive_tables = {
    "post": ("id", "parent_id"),
    "preferences": ("id", "cascade_id")
}

# TODO: Make it dependent on engine
column_casts = {
    "idea": {
        "last_modified": DATETIME
    }
}

history_tables = ["idea", "idea_idea_link", "idea_vote"]


def maybe_cast(column):
    cast_to = column_casts.get(column.table.name, {}).get(column.name, None)
    return column if cast_to is None else cast(column, cast_to)


def is_virtuoso(session):
    return str(session.bind.url).startswith('virtuoso')


def set_sequence(session, name, value):
    session.execute(
            "SELECT {command}('{name}', {value})".format(
                command="sequence_set" if is_virtuoso(session) else "setval",
                name=name, value=value))


def get_sequence(session, name):
    if is_virtuoso(session):
        return session.query("sequence_set('%s', 0, 1)" % (name,)).first()[0]
    else:
        return session.query("currval('%s')" % (name,)).first()[0]


def copy_table(source_session, dest_session, source_table, dest_table):
    columns = [maybe_cast(c) for c in source_table.c]
    cnames = [c.name for c in source_table.c]
    values = source_session.query(*columns)
    values = [dict(zip(cnames, val)) for val in values]
    if not len(values):
        return
    if source_table.name in recursive_tables:
        idx_name, fkey_name = recursive_tables[source_table.name]
        done = set()
        while len(values):
            batch = values
            values = list()
            next_batch = list()
            for val in batch:
                fkey = val[fkey_name]
                if fkey is None or fkey in done:
                    values.append(val)
                else:
                    next_batch.append(val)
            assert len(values)
            dest_session.execute(dest_table.insert(), values)
            done.update((val[idx_name] for val in values))
            values = next_batch
    else:
        dest_session.execute(dest_table.insert(), values)
    if str(dest_session.bind.url).startswith('postgresql'):
        idx_col = dest_table.c.get("id", None)
        if idx_col is not None and not idx_col.foreign_keys:
            (max_id,) = source_session.query(
                'max(id) from "%s"' % (source_table.name,)).first()
            if dest_table.name in history_tables:
                max_id = max(max_id, get_sequence(
                    source_session, source_table.fullname+"_idsequence"))
                set_sequence(dest_session, dest_table.fullname+"_idsequence", max_id)
            elif not is_virtuoso(dest_session):
                set_sequence(dest_session, dest_table.fullname+"_id_seq", max_id)


def engine_from_settings(config, full_config=False):
    settings = get_appsettings(config, 'assembl')
    if settings['sqlalchemy.url'].startswith('virtuoso:'):
        db_schema = '.'.join((settings['db_schema'], settings['db_user']))
    else:
        db_schema = settings['db_schema']
    set_config(settings, True)
    session = None
    if full_config:
        env = bootstrap(config)
        configure_zmq(settings['changes_socket'], False)
        configure_indexing()
        configure_model_watcher(env['registry'], 'assembl')
        logging.config.fileConfig(config)
    else:
        session = make_session_maker(zope_tr=True)
    import assembl.models
    from assembl.lib.sqla import class_registry
    engine = configure_engine(settings, session_maker=session)
    metadata = get_metadata()
    metadata.bind = engine
    session = sessionmaker(engine)()
    return (metadata, session)


def copy_database(source_config, dest_config):
    dest_metadata, dest_session = engine_from_settings(
        dest_config, True)
    dest_tables = dest_metadata.sorted_tables
    source_metadata, source_session = engine_from_settings(
        source_config, False)
    source_tables_by_name = {
        table.name: table.tometadata(source_metadata, source_metadata.schema)
        for table in dest_tables
    }

    for table in reversed(dest_tables):
        if table.name in recursive_tables:
            colname = recursive_tables[table.name][1]
            dest_session.execute(update(table).values(**{colname: None}))
        dest_session.execute(delete(table))

    for table in dest_tables:
        copy_table(
            source_session, dest_session,
            source_tables_by_name[table.name], table)
    dest_session.commit()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Copy database. Will wipe the destination database.')
    parser.add_argument(
        "source_config",
        help="""configuration file with source database configuration.""")
    parser.add_argument(
        "dest_config",
        help="""configuration file with target database configuration.""")
    parser.add_argument("--debug", action="store_true", default=False,
                        help="enter pdb on failure")

    args = parser.parse_args()
    assert args.source_config != args.dest_config,\
        "source and destination must be different!"
    try:
        copy_database(args.source_config, args.dest_config)
    except Exception as e:
        traceback.print_exc()
        if args.debug:
            pdb.post_mortem()
