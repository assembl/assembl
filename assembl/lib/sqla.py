"""Some utilities for working with SQLAlchemy."""

import re
import sys
from datetime import datetime
from itertools import groupby

from anyjson import dumps
from colanderalchemy import SQLAlchemySchemaNode
from sqlalchemy import (
    DateTime, MetaData, engine_from_config, event, Column, ForeignKey)
from sqlalchemy.ext.declarative import declarative_base, declared_attr
from sqlalchemy.orm import mapper, scoped_session, sessionmaker
from sqlalchemy.orm.util import has_identity
from sqlalchemy.util import classproperty
from sqlalchemy.orm.session import object_session
from zope.sqlalchemy import ZopeTransactionExtension
from zope.sqlalchemy.datamanager import mark_changed as z_mark_changed
import zmq

from pyramid.paster import get_appsettings, setup_logging

from ..view_def import get_view_def
from .zmqlib import context as zmq_context

_TABLENAME_RE = re.compile('([A-Z]+)')

_session_maker = None


def declarative_bases(metadata):
    """Return all declarative bases bound to a single metadata object."""
    registry = dict()
    return (declarative_base(cls=BaseOps, metadata=metadata,
                             class_registry=registry),
            declarative_base(cls=Timestamped, metadata=metadata,
                             class_registry=registry))


class BaseOps(object):
    """Basic database operations are abstracted away in this class.

    The idea is to have the API as independent as practically possible from
    both data storage- and web- specific stuff.

    """
    # @declared_attr
    # def __tablename__(cls):
    #     """Return a table name made out of the model class name."""
    #     return _TABLENAME_RE.sub(r'_\1', cls.__name__).strip('_').lower()

    @classproperty
    def db(cls):
        """Return the SQLAlchemy db session maker object."""
        assert _session_maker is not None
        return _session_maker

    def __iter__(self, **kwargs):
        """Return a generator that iterates through model columns."""
        return self.iteritems(**kwargs)

    def iteritems(self, include=None, exclude=None):
        """Return a generator that iterates through model columns.

        Fields iterated through can be specified with include/exclude.

        """
        if include is not None and exclude is not None:
            include = set(include) - set(exclude)
            exclude = None
        for c in self.__table__.columns:
            if ((not include or c.name in include)
                    and (not exclude or c.name not in exclude)):
                yield(c.name, getattr(self, c.name))

    @classmethod
    def validator(cls, mapping_cls=None, include=None, exclude=None):
        """Return a ColanderAlchemy schema mapper.

        Fields targeted by the validator can be specified with include/exclude.

        """
        if include == '__nopk__':
            includes = cls._col_names() - cls._pk_names()
        elif include == '__pk__':
            includes = cls._pk_names()
        elif include is None:
            includes = cls._col_names()
        else:
            includes = set(include)
        if exclude is not None:
            includes -= set(exclude)

        if mapping_cls is None:
            mapping_cls = SQLAlchemySchemaNode
        return mapping_cls(cls, includes=list(includes))

    @classmethod
    def _col_names(cls):
        """Return a list of the columns, as a set."""
        return set(cls.__table__.c.keys())

    @classmethod
    def _pk_names(cls):
        """Return a list of the primary keys, as a set."""
        return set(cls.__table__.primary_key.columns.keys())

    @property
    def is_new(self):
        """Return True if the instance wasn't fetched from the database."""
        return not has_identity(self)

    @classmethod
    def create(cls, obj=None, flush=False, **values):
        if obj is None:
            obj = cls(**values)
        else:
            obj.update(**values)
        obj.save(flush)
        return obj

    @classmethod
    def get(cls, raise_=False, **criteria):
        """Return the record corresponding to the criteria.

        Throw an exception on record not found and `raise_` == True, else
        return None.

        """
        q = _session_maker.query(cls).filter_by(**criteria)
        return raise_ and q.one() or q.first()

    @classmethod
    def find(cls, **criteria):
        return _session_maker.query(cls).filter_by(**criteria).all()

    def delete(self):
        _session_maker.delete(self)

    def update(self, **values):
        fields = self._col_names()
        for name, value in values.iteritems():
            if name in fields:
                setattr(self, name, value)

    def save(self, flush=False):
        if self.is_new:
            _session_maker.add(self)
        if flush:
            _session_maker.flush()

    @classmethod
    def inject_api(cls, name, as_object=False):
        """Inject common methods in an API module."""
        class API(object):
            pass
        container = API() if as_object else sys.modules[name]

        for attr in 'create', 'get', 'find', 'validator':
            setattr(container, attr, getattr(cls, attr))

        if as_object:
            return container

    def get_id_as_str(self):
        id = getattr(self, 'id', None)
        if not id:
            raise NotImplemented()
        return str(id)

    def get_discussion_id(self):
        "Get the ID of an associated discussion object, if any."
        return None

    @classmethod
    def external_typename(cls):
        return cls.__name__

    @classmethod
    def uri_generic(cls, base_uri, id):
        if not id:
            return None
        return base_uri + cls.external_typename() + "/" + str(id)

    def uri(self, base_uri='local:'):
        return self.uri_generic(base_uri, self.get_id_as_str())

    def generic_json(self, base_uri='local:', view_def_name='base'):
        view_def = get_view_def(view_def_name)
        my_typename = self.external_typename()
        my_id = self.uri(base_uri)
        result = {
            '@id': my_id,
            '@type': my_typename,
            '@view': view_def_name
        }
        local_view = view_def.get(my_typename, {})
        mapper = self.__class__.__mapper__
        relns = {r.key: r for r in mapper.relationships}
        cols = {c.key: c for c in mapper.columns}
        fkeys = {c for c in mapper.columns if isinstance(c, ForeignKey)}
        fkeys_of_reln = {
            frozenset(r._calculated_foreign_keys): r
            for r in mapper.relationships
        }

        for name, spec in local_view.iteritems():
            if name == "_default":
                continue
            if type(spec) is list:
                assert len(spec) == 1
                assert name in relns
                view_name = spec[0]
                assert type(view_name) == str
                assert relns[name].uselist
                if view_name == "@id":
                    result[name] = [ob.uri(base_uri)
                                    for ob in getattr(self, name)]
                elif get_view_def(view_name) is not None:
                    result[name] = [
                        ob.generic_json(base_uri, view_name)
                        for ob in getattr(self, name)]
                else:
                    raise "view does not exist", view_name
            elif type(spec) is dict:
                assert len(spec) == 1
                assert "@id" in spec
                assert name in relns
                view_name = spec['@id']
                assert type(view_name) == str
                assert relns[name].uselist
                view = get_view_def(view_name)
                assert view
                result[name] = {
                    ob.uri(base_uri):
                    ob.generic_json(base_uri, view_name)
                    for ob in getattr(self, name, [])}
            elif (spec is True and name in cols) or spec in cols:
                cname = name if spec is True else spec
                val = getattr(self, cname)
                if val:
                    if type(val) == datetime:
                        val = val.isoformat()
                    result[name] = val
            elif spec is False:
                pass
            elif (spec is True and name in relns) or spec in relns:
                assert not relns[name].uselist
                rname = name if spec is True else spec
                reln = relns[rname]
                if len(reln._calculated_foreign_keys) == 1 \
                        and reln._calculated_foreign_keys < fkeys:
                    # shortcut, avoid fetch
                    fkey = list(reln._calculated_foreign_keys)[0]
                    ob_id = getattr(self, fkey.name)
                    if ob_id:
                        result[name] = reln.mapper.class_.uri_generic(
                            base_uri, ob_id)
                else:
                    ob = getattr(self, rname)
                    if ob:
                        result[name] = ob.uri(base_uri)
            elif name in relns and get_view_def(spec) is not None:
                assert not relns[name].uselist
                ob = getattr(self, name)
                if ob:
                    result[name] = getattr(self, name).generic_json(
                        base_uri, spec)
        if local_view.get('_default') is False:
            return result
        defaults = view_def.get('_default', {})
        for name, col in cols.items():
            if name in local_view:
                continue  # already done
            if defaults.get(name) is False:
                continue
            as_rel = fkeys_of_reln.get(frozenset((col, )))
            if as_rel:
                name = as_rel.key
                if name in local_view or defaults.get(name) is False:
                    continue
                else:
                    ob_id = getattr(self, col.key)
                    if ob_id:
                        result[name] = as_rel.mapper.class_.uri_generic(
                            base_uri, ob_id)
            else:
                ob = getattr(self, name)
                if ob:
                    if type(ob) == datetime:
                        ob = ob.isoformat()
                    result[name] = ob
        return result


class Timestamped(BaseOps):
    """An automatically timestamped mixin."""
    ins_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    mod_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    _stamps = ['ins_date', 'mod_date']

    def iteritems(self, include=None, exclude=None):
        if exclude is None:
            exclude = self._stamps
        elif len(exclude) > 0:
            exclude = set(exclude) | set(self._stamps)
        return super(Timestamped, self).iteritems(exclude=exclude,
                                                  include=include)

    @classmethod
    def validator(cls, exclude=None, **kwargs):
        """Return a ColanderAlchemy schema mapper.

        Fields targeted by the validator can be specified with include/exclude.

        """
        if exclude is None:
            exclude = cls._stamps
        elif len(exclude) > 0:
            exclude = set(exclude) | set(cls._stamps)
        kwargs['exclude'] = exclude
        return super(Timestamped, cls) \
            .validator(mapping_cls=TimestampedSQLAlchemySchemaNode, **kwargs)


class TimestampedSQLAlchemySchemaNode(SQLAlchemySchemaNode):
    """The ColanderAlchemy schema mapper for TimestampedBase."""
    def __init__(self, cls, excludes=None, **kwargs):
        stamps = ['ins_date', 'mod_date']
        if excludes is None:
            excludes = stamps
        elif len(excludes) > 0:
            excludes = set(excludes) | set(stamps)
        parent = super(TimestampedSQLAlchemySchemaNode, self)
        return parent.__init__(cls, excludes=excludes, **kwargs)


def insert_timestamp(mapper, connection, target):
    """Initialize timestamps on models that have these fields.

    Event handler for 'before_insert'.

    """
    timestamp = datetime.utcnow()
    if hasattr(target, 'ins_date'):
        target.ins_date = timestamp
    if hasattr(target, 'mod_date'):
        target.mod_date = timestamp


def update_timestamp(mapper, connection, target):
    """Update the modified date on models that have this field.

    Event handler for 'before_update'.

    """
    if hasattr(target, 'mod_date'):
        target.mod_date = datetime.utcnow()


metadata = MetaData()
Base, TimestampedBase = declarative_bases(metadata)

# If obsolete table names collide with new table names, alembic can't work
obsolete = MetaData()
ObsoleteBase, TimestampedObsolete = declarative_bases(obsolete)

event.listen(mapper, 'before_insert', insert_timestamp)
event.listen(mapper, 'before_update', update_timestamp)


def get_session_maker(zope_tr=True):
    global _session_maker
    if _session_maker is None:
        # This path is executed once, and maybe not when you expect it.
        # nosetest may fail if the session_maker is built with the ZTE.
        # This will happen if any of the models is imported before the
        # nose plugin is configured. In that case, trace the importation thus:
        # print "ZOPISH SESSIONS: ", zope_tr
        # import traceback; traceback.print_stack();
        ext = None
        if zope_tr:
            ext = ZopeTransactionExtension()
        _session_maker = scoped_session(sessionmaker(extension=ext))
    return _session_maker


def orm_update_listener(mapper, connection, target):
    session = object_session(target)
    if session.is_modified(target, include_collections=False):
        if 'cdict' not in connection.info:
            connection.info['cdict'] = {}
        connection.info['cdict'][target.uri()] = (
            target.get_discussion_id(),
            target.generic_json(view_def_name='local'))


def orm_insert_listener(mapper, connection, target):
    if 'cdict' not in connection.info:
        connection.info['cdict'] = {}
    connection.info['cdict'][target.uri()] = (
        target.get_discussion_id(),
        target.generic_json(view_def_name='local'))


def orm_delete_listener(mapper, connection, target):
    if 'cdict' not in connection.info:
        connection.info['cdict'] = {}
    connection.info['cdict'][target.uri()] = (
        target.get_discussion_id(), {
            "@type": target.external_typename(),
            "@id": target.uri(),
            "@tombstone": True})


def commit_listener(connection):
    if 'cdict' in connection.info:
        socket = zmq_context.socket(zmq.PUB)
        socket.connect('inproc://assemblchanges')
        for discussion, changes in groupby(
                connection.info['cdict'].values(), lambda x: x[0]):
            discussion = bytes(discussion or "*")
            changes = [x[1] for x in changes]
            socket.send(discussion, zmq.SNDMORE)
            socket.send_json(changes)
            print "sent", discussion, changes
        # TODO: Check if the following is needed.
        # socket.disconnect('inproc://assemblchanges')
        socket.close(linger=500)
    else:
        print "EMPTY CDICT!"


def rollback_listener(connection):
    connection.info['cdict'] = {}


event.listen(BaseOps, 'after_insert', orm_insert_listener, propagate=True)
event.listen(BaseOps, 'after_update', orm_update_listener, propagate=True)
event.listen(BaseOps, 'after_delete', orm_delete_listener, propagate=True)


def configure_engine(settings, zope_tr=True, session_maker=None):
    """Return an SQLAlchemy engine configured as per the provided config."""
    if session_maker is None:
        session_maker = get_session_maker(zope_tr)
    engine = session_maker.session_factory.kw['bind']
    if engine:
        return engine
    engine = engine_from_config(settings, 'sqlalchemy.')
    session_maker.configure(bind=engine)
    event.listen(engine, 'commit', commit_listener)
    event.listen(engine, 'rollback', rollback_listener)
    return engine


def is_zopish():
    return isinstance(
        _session_maker.session_factory.kw.get('extension'),
        ZopeTransactionExtension)


def mark_changed():
    z_mark_changed(get_session_maker()())


def includeme(config):
    """Initialize SQLAlchemy at app start-up time."""
    configure_engine(config.registry.settings)
