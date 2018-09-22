"""Rebuild all tables from scratch, because we have had so many cases of corrupt data."""
from itertools import chain
import logging.config
import argparse
from collections import defaultdict
import traceback
import pdb

from pyramid.paster import get_appsettings
import transaction
from sqlalchemy import Table, Column, ForeignKey, Boolean
from sqlalchemy.orm.attributes import InstrumentedAttribute
from sqlalchemy.schema import DropTable
from sqlalchemy.sql.expression import select, alias

from assembl.lib.sqla import (
    configure_engine, get_metadata, get_session_maker, mark_changed)
from assembl.lib.zmqlib import configure_zmq
from assembl.lib.config import set_config
from assembl.indexing.changes import configure_indexing


def rebuild_all_tables_fkeys(session, rebuild_tables=None, delete_missing=False):
    import assembl.models
    rebuild_tables = rebuild_tables or ()
    tables = assembl.models.get_metadata().sorted_tables
    tables.reverse()
    for table in tables:
        if table.name in rebuild_tables:
            rebuild_table(table, delete_missing)
        else:
            rebuild_table_fkeys(session, table, delete_missing)


def rebuild_all_tables(session, delete_missing=False):
    import assembl.models
    tables = assembl.models.get_metadata().sorted_tables
    # tables.reverse()
    for table in tables:
        rebuild_table(table, delete_missing)


def rebuild_table_fkeys(session, table, delete_missing=False):
    keys = list(table.foreign_keys)
    # Finish by parent
    # keys.sort(key=lambda k: (k.parent.primary_key, k.parent.name))
    for fk in keys:
        if not rebuild_fkey(session, fk, delete_missing):
            break


def fk_as_str(fk):
    return "Foreign_key(%s->%s)" % (fk.parent, fk.column)


def rebuild_fkey(session, fk, delete_missing=False):
    from virtuoso.alchemy import AddForeignKey, DropForeignKey
    if not delete_rows_with_missing_fkey(fk, delete_missing):
        print "There are missing keys, will not reset ", fk_as_str(fk)
        return
    try:
        session.execute(DropForeignKey(fk))
    except Exception as e:
        print "Could not drop fkey %s, maybe does not exist." % (fk_as_str(fk),)
        print e
    try:
        session.execute(AddForeignKey(fk))
    except Exception as e:
        print e
        try:
            session.execute(AddForeignKey(fk))
        except Exception:
            rebuild_table(fk.parent.table, delete_missing)
            return False
    return True


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


def _as_fkey(col):
    if isinstance(col, InstrumentedAttribute):
        col = col.property.columns[0]
    if isinstance(col, Column):
        col = next(iter(col.foreign_keys))
    assert isinstance(col, ForeignKey)
    return col


def primary_key_col(table):
    return next(iter(table.primary_key.columns))


def delete_row(session, table, id):
    if id is None:
        return
    incoming = get_incoming_fks(table)
    for fk in incoming:
        origin_table = fk.parent.table
        primary_key = primary_key_col(origin_table)
        # assert primary_key != fk.parent
        for (iid,) in session.query(primary_key).filter(fk.parent==id):
            delete_row(session, origin_table, iid)
    session.execute(table.delete(primary_key_col(table) == id))


def delete_rows_with_missing_fkey(fkey, delete_missing=True):
    fkey = _as_fkey(fkey)
    if fkey.parent.nullable:
        return True
    session = get_session_maker()()
    source = fkey.parent.table
    target = fkey.column.table
    if source == target:
        target = alias(source)
    source_primary_key = primary_key_col(source)
    q = session.query(source_primary_key).outerjoin(
        target, fkey.parent == fkey.column).filter(
        target.c.id == None)
    count = q.count()
    if count:
        if delete_missing:
            with transaction.manager:
                #session.execute(source.delete(source.c.id.in_(q)))
                for (id,) in q:
                    delete_row(session, source, id)
                mark_changed(session)
        else:
            print "There are %d ids in %s with dangling %s:" % (
                count, source.name, fk_as_str(fkey))
            print q.all()
            return False
    return True


def ensure_inheritance():
    from assembl.models import Base
    subs = {c:c.mro()[1] for c in Base.get_subclasses()}
    subof = defaultdict(set)
    for sub, cls in subs.iteritems():
        subof[cls].add(sub)
    treated = set()
    def rec_rebuild(cls):
        if cls in treated:
            return
        for sub in subof[cls]:
            rec_rebuild(sub)
        ensure_inheritance_of(cls)
    bases = [cls for cls in subof
        if getattr(cls, '__mapper_args__', {}).get('polymorphic_on', None) is not None]
    for cls in bases:
        rec_rebuild(cls)


def ensure_inheritance_of(cls):
    # Do not bother with tableless classes
    if not '__tablename__' in cls.__dict__:
        return
    base = cls
    first = None
    table = cls.__table__
    for c in cls.mro():
        if c == cls:
            continue
        if '__tablename__' in c.__dict__:
            if first is None:
                first = c
            base = c
    if base == cls:
        return
    basetable = base.__table__
    db = get_session_maker()()
    poly_col = base.__mapper_args__['polymorphic_on']
    if not isinstance(poly_col, Column):
        poly_col = basetable.c[poly_col]
    poly_id = cls.__mapper_args__['polymorphic_identity']
    sub_poly_id = first.__mapper_args__['polymorphic_identity']
    query = db.query(basetable.c.id).outerjoin(table, basetable.c.id==table.c.id).filter((poly_col==poly_id) & (table.c.id==None))
    if query.count() > 0:
        with transaction.manager:
            db.execute(basetable.update().where(basetable.c.id.in_(query)).values(**{poly_col.name: sub_poly_id}))
            mark_changed(db)


def rebuild_table(table, delete_missing=False):
    from virtuoso.alchemy import AddForeignKey, DropForeignKey
    print "rebuilding", table
    session = get_session_maker()()
    incoming = set(get_incoming_fks(table))
    outgoing = set(table.foreign_keys)
    all_fkeys = incoming | outgoing
    self_ref = incoming & outgoing
    try:
        for fk in all_fkeys:
            if not delete_rows_with_missing_fkey(fk, delete_missing):
                print "There are missing keys, will not rebuild " + table.name
                return
    except Exception as e:
        traceback.print_exc()
        print "Could not delete missing keys"
        raise e
    # Booleans with NULL values
    for col in table.c:
        if isinstance(col.type, Boolean):
            session.execute(table.update().where(col == None).values(**{col.name:0}))
    # Drop all keys
    for fk in all_fkeys:
        try:
            session.execute(DropForeignKey(fk))
        except Exception as e:
            print "Could not drop fkey %s, maybe does not exist." % (fk_as_str(fk),)
            print e
    clone = clone_table(table, table.name+"_temp", False, False)
    clone.create(session.bind)
    column_names = [c.name for c in table.columns]
    sel = select([getattr(table.c, cname) for cname in column_names])
    with transaction.manager:
        session.execute(clone.insert().from_select(column_names, sel))
        mark_changed(session)
    session.execute(DropTable(table))
    # Should we create it without outgoing first?
    table.create(session.bind)
    # self ref will make the insert fail.
    for fk in self_ref:
        try:
            session.execute(DropForeignKey(fk))
        except Exception as e:
            print "Could not drop fkey %s, maybe does not exist." % (fk_as_str(fk),)
            print e
    sel = select([getattr(clone.c, cname) for cname in column_names])
    with transaction.manager:
        session.execute(table.insert().from_select(column_names, sel))
        mark_changed(session)
    session.execute(DropTable(clone))
    if delete_missing:
        # Delete a second time, in case.
        for fk in outgoing:
            assert delete_rows_with_missing_fkey(fk, True), "OUCH"
    for fk in incoming:  # includes self_ref
        session.execute(AddForeignKey(fk))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "configuration",
        help="configuration file with destination database configuration")
    parser.add_argument("-t", "--rebuild_table", action="append", default=[],
                        help="This table will be rebuilt.")
    parser.add_argument("-k", "--rebuild_table_fkey", action="append", default=[],
                        help="This table's fkeys will be rebuilt.")
    parser.add_argument("--rebuild_all_fkeys", action="store_true", default=False,
                        help="All tables fkeys will be rebuilt.")
    parser.add_argument("--rebuild_all_tables", action="store_true", default=False,
                        help="All tables will be rebuilt.")
    parser.add_argument("--ensure_inheritance", action="store_true", default=False,
                        help="Make sure no class has a missing subclass row.")
    parser.add_argument("-d", "--delete_missing", action="store_true", default=False,
                        help="Delete rows with missing corresponding values. (otherwise abort rebuild.)")
    parser.add_argument("--reset_extract_discussion", action="store_true", default=False,
                        help="Special case: rebuild a dependent foreign key on extract table")
    args = parser.parse_args()
    settings = get_appsettings(args.configuration, 'assembl')
    set_config(settings)
    logging.config.fileConfig(args.configuration)
    configure_zmq(settings['changes_socket'], False)
    configure_indexing()
    configure_engine(settings, True)
    session = get_session_maker()()
    import assembl.models
    try:
        if (args.reset_extract_discussion and
                session.query(assembl.models.Extract).filter_by(discussion_id=-1).count()):
            session.execute("""UPDATE "extract" SET discussion_id = (
                SELECT content.discussion_id FROM content
                    JOIN idea_content_link on (content_id=content.id)
                    JOIN "extract" on ("extract".id = idea_content_link.id)
                    WHERE "extract".discussion_id=-1)""")
        if args.rebuild_all_tables:
            rebuild_all_tables(session, args.delete_missing)
        elif args.rebuild_all_fkeys:
            rebuild_all_tables_fkeys(session, args.rebuild_table, args.delete_missing)
        else:
            tables = assembl.models.get_metadata().sorted_tables
            tables.reverse()
            for table in tables:
                if table.name in args.rebuild_table:
                    rebuild_table(table, args.delete_missing)
                elif table in args.rebuild_table_fkey:
                    rebuild_table_fkeys(session, table, args.delete_missing)
        if args.ensure_inheritance:
            ensure_inheritance()
    except Exception as e:
        traceback.print_exc()
        pdb.post_mortem()
