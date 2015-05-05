import sys
from itertools import chain
import logging.config
import argparse

from pyramid.paster import get_appsettings
import transaction
from sqlalchemy import Table, Column, ForeignKey
from sqlalchemy.orm.attributes import InstrumentedAttribute
from sqlalchemy.schema import DropTable
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.sql.expression import select, alias
from zope.sqlalchemy import mark_changed

from virtuoso.alchemy import AddForeignKey, DropForeignKey

from assembl.lib.sqla import (
    configure_engine, get_metadata, get_session_maker)
from assembl.lib.zmqlib import configure_zmq
from assembl.lib.config import set_config

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "configuration",
        help="configuration file with destination database configuration")
    parser.add_argument("-r", "--rebuild_table", action="append", default=[],
                        help="This table will just be rebuilt.")
    args = parser.parse_args()
    settings = get_appsettings(args.configuration, 'assembl')
    set_config(settings)
    logging.config.fileConfig(args.configuration)
    configure_zmq(settings['changes.socket'], False)
    configure_engine(settings, True)
    session = get_session_maker(False)
    import assembl.models
    tables = get_metadata().sorted_tables
    tables.reverse()
    # special case
    session.execute("""UPDATE "extract" SET discussion_id = (
        SELECT content.discussion_id FROM content 
            JOIN idea_content_link on (content_id=content.id)
            JOIN "extract" on ("extract".id = idea_content_link.id)
            WHERE "extract".discussion_id=-1)""")
    for table in tables:
        print "table", table.name
        if table.name in args.rebuild_table:
            rebuild_table(table)
            continue
        keys = list(table.foreign_keys)
        # Finish by parent
        # keys.sort(key=lambda k: (k.parent.primary_key, k.parent.name))
        for fk in keys:
            print fk
            #These two keys bug. WHY?
            if (table.name, fk.parent.name) not in {('extract', 'id'), ('extract', 'discussion_id')}:
                continue
            missing_fkey(fk)
            continue
            try:
                session.execute(DropForeignKey(fk))
            except Exception as e:
                print e
            try:
                session.execute(AddForeignKey(fk))
            except ProgrammingError as e:
                print e
                try:
                    missing_fkey(fk)
                    session.execute(AddForeignKey(fk))
                except Exception:
                    rebuild_table(table)
                    break


def get_incoming_fks(table):
    incoming = set()
    for t in get_metadata().sorted_tables:
        for fk in t.foreign_keys:
            if fk.column.table == table:
                incoming.add(fk)    
    return incoming


def clone_table(table, new_name=None, indexes=True, fkeys=True, nullable=True):
    new_columns = []
    for c in table.columns:
        if c.system:
            continue
        args = []
        kwargs = dict(
            primary_key=c.primary_key,
            autoincrement = c.autoincrement,
            server_onupdate = c.server_onupdate,
            )
        if indexes:
            kwargs['index'] = c.index
            kwargs['unique'] = c.unique
        if nullable:
            kwargs['nullable'] = c.nullable
        if fkeys:
            for fk in c.foreign_keys:
                args.append(ForeignKey(
                    fk.column, name=fk.name, onupdate=fk.onupdate, ondelete=fk.ondelete))
        new_columns.append(Column(c.name, c.type, *args, **kwargs))
    return Table(new_name or table.name, table.metadata, *new_columns)


def as_fkey(col):
    if isinstance(col, InstrumentedAttribute):
        col = col.property.columns[0]
    if isinstance(col, Column):
        col = next(iter(col.foreign_keys))
    assert isinstance(col, ForeignKey)
    return col


def missing_fkey(fkey, delete=True):
    fkey = as_fkey(fkey)
    if fkey.parent.nullable:
        return
    session = get_session_maker(False)
    source = fkey.parent.table
    target = fkey.column.table
    if source == target:
        target = alias(source)
    q = session.query(source.c.id).outerjoin(
        target, fkey.parent == fkey.column).filter(
        target.c.id == None)
    count = q.count()
    if count and delete:
        print count
        with transaction.manager:
            session.execute(source.delete(source.c.id.in_(q)))
            mark_changed(session())


def rebuild_table(table):
    print "rebuilding", table
    session = get_session_maker(False)
    incoming = get_incoming_fks(table)
    outgoing = table.foreign_keys
    for fk in chain(incoming, outgoing):
        try:
            session.execute(DropForeignKey(fk))
        except Exception as e:
            print e
    clone = clone_table(table, table.name+"_temp", False, False)
    clone.create(session.bind)
    column_names = [c.name for c in table.columns]
    sel = select([getattr(table.c, cname) for cname in column_names])
    session.execute(clone.insert().from_select(column_names, sel))
    session.execute(DropTable(table))
    # Should we create it without outgoing first?
    table.create(session.bind)
    sel = select([getattr(clone.c, cname) for cname in column_names])
    session.execute(table.insert().from_select(column_names, sel))
    for fk in outgoing:
        session.execute(AddForeignKey(fk))

if __name__ == '__main__':
    main()
