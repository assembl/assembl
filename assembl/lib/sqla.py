"""Some utilities for working with SQLAlchemy."""

from __future__ import absolute_import

import re
import sys
from datetime import datetime
import inspect as pyinspect
import types
from collections import Iterable, defaultdict
import atexit

from anyjson import dumps, loads
from colanderalchemy import SQLAlchemySchemaNode
from sqlalchemy import (
    DateTime, MetaData, engine_from_config, event, Column, ForeignKey,
    Integer, inspect)
from sqlalchemy.exc import NoInspectionAvailable
from sqlalchemy.ext.declarative import declarative_base, declared_attr
from sqlalchemy.orm import mapper, scoped_session, sessionmaker
from sqlalchemy.orm.interfaces import MANYTOONE
from sqlalchemy.orm.util import has_identity
from sqlalchemy.util import classproperty
from sqlalchemy.orm.session import object_session, Session
from sqlalchemy.engine import strategies
from virtuoso.vmapping import PatternIriClass
from zope.sqlalchemy import ZopeTransactionExtension
from zope.sqlalchemy.datamanager import mark_changed as z_mark_changed
from zope.component import getGlobalSiteManager

from pyramid.paster import get_appsettings, setup_logging

from ..view_def import get_view_def
from .zmqlib import get_pub_socket, send_changes
from ..semantic.namespaces import QUADNAMES
from ..auth import *

atexit_engines = []


class CleanupStrategy(strategies.PlainEngineStrategy):
    name = 'atexit_cleanup'

    def create(self, *args, **kwargs):
        engine = super(CleanupStrategy, self).create(*args, **kwargs)
        atexit_engines.append(engine)
        return engine

CleanupStrategy()


@atexit.register
def dispose_sqlengines():
    #print "ATEXIT", atexit_engines
    [e.dispose() for e in atexit_engines]

_TABLENAME_RE = re.compile('([A-Z]+)')

_session_maker = None
db_schema = None
_metadata = None
Base = TimestampedBase = None
# If obsolete table names collide with new table names, alembic can't work
obsolete = None
ObsoleteBase = TimestampedObsolete = None
class_registry = dict()
aliased_class_registry = None


def declarative_bases(metadata, registry=None):
    """Return all declarative bases bound to a single metadata object."""
    if registry is None:
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
            if 'id' not in self.__class__.__dict__:
                raise NotImplementedError("get_id_as_str on " +
                    self.__class__.__name__)
            return None
        return str(id)

    def tombstone(self):
        return Tombstone(self)

    def send_to_changes(self, connection=None):
        if not connection:
            # WARNING: invalidate has to be called within an active transaction.
            # This should be the case in general, no need to add a transaction manager.
            connection = self.db().connection()
        if 'cdict' not in connection.info:
            connection.info['cdict'] = {}
        connection.info['cdict'][self.uri()] = (
            None, self)

    @classmethod
    def external_typename(cls):
        return cls.__name__

    @classmethod
    def external_typename_with_inheritance(cls):
        """ Returns the root ancestor class typename """
        if cls.__mapper__.polymorphic_identity is not None:
            for nextclass in cls.mro():
                if getattr(nextclass, '__mapper__', None) is None:
                    break
                if nextclass.__mapper__.polymorphic_identity is not None:
                    cls = nextclass
        return cls.external_typename()

    @classmethod
    def uri_generic(cls, id, base_uri='local:'):
        if not id:
            return None
        return base_uri + cls.external_typename_with_inheritance() + "/" + str(id)

    @classmethod
    def iri_class(cls):
        if getattr(cls, '_iri_class', 0) is 0:
            id_column = getattr(cls, 'id', None)
            if id_column is None:
                cls._iri_class = None
                return
            clsname = cls.external_typename_with_inheritance()
            iri_name = clsname + "_iri"
            cls._iri_class = PatternIriClass(
                getattr(QUADNAMES, iri_name),
                'http://%{WSHostName}U/data/'+clsname+'/%d', None,
                ('id', Integer, False))
        return cls._iri_class

    @classmethod
    def base_condition(cls):
        return None

    @classmethod
    def special_quad_patterns(cls, alias_manager):
        # Note: If defined somewhere, override in subclasses to avoid inheritance.
        return []

    @classmethod
    def get_instance(cls, identifier):
        try:
            # temporary hack
            num = int(identifier)
        except ValueError:
            num = cls.get_database_id(identifier)
        if num:
            return cls.get(id=num)

    @classmethod
    def get_database_id(cls, uri):
        if isinstance(uri, types.StringTypes):
            if not uri.startswith('local:') or '/' not in uri:
                return
            uriclsname, num = uri[6:].split('/', 1)
            uricls = get_named_class(uriclsname)
            if not uricls:
                return
            if uricls == cls or uricls in cls.mro() or cls in uricls.mro():
                try:
                    return int(num)
                except ValueError:
                    pass

    def uri(self, base_uri='local:'):
        return self.uri_generic(self.get_id_as_str(), base_uri)

    def change_class(self, newclass, **kwargs):
        def table_list(cls):
            tables = []
            for cls in cls.mro():
                try:
                    m = inspect(cls)
                    t = m.local_table
                    if (not tables) or tables[-1] != t:
                        tables.append(t)
                except NoInspectionAvailable:
                    break
            return tables
        oldclass_tables = table_list(self.__class__)
        newclass_tables = table_list(newclass)
        newclass_mapper = inspect(newclass)
        if newclass_tables[-1] != oldclass_tables[-1]:
            raise TypeError()
        while (newclass_tables and oldclass_tables and
                newclass_tables[-1] == oldclass_tables[-1]):
            newclass_tables.pop()
            oldclass_tables.pop()
        newclass_tables.reverse()
        setattr(self, newclass_mapper.polymorphic_on.key,
                newclass_mapper.polymorphic_identity)
        db = self.db
        id = self.id
        db.flush()
        db.expunge(self)
        for table in oldclass_tables:
            db.execute(table.delete().where(table.c.id == id))

        for table in newclass_tables:
            col_names = {c.key for c in table.c}
            local_kwargs = {k: v for (k, v) in kwargs.iteritems()
                            if k in col_names and k != 'id'}
            db.execute(table.insert().values(id=id, **local_kwargs))

        new_object = db.query(newclass).get(id)
        new_object.send_to_changes()
        return new_object

    def generic_json(self, view_def_name='default',
                     base_uri='local:', use_dumps=False):
        view_def = get_view_def(view_def_name)
        my_typename = self.external_typename()
        result = {}
        local_view = view_def.get(my_typename, False)
        if local_view is False:
            return None
        assert isinstance(local_view, dict),\
            "in viewdef %s, definition for class %s is not a dict" % (
                view_def_name, my_typename)
        if '_default' not in local_view:
            view = local_view
            views = [view]
            local_view = dict(view_def.get('_default', {'_default': False}))
            while '@extends' in view:
                ex = view['@extends']
                assert ex in view_def,\
                    "In viewdef %s, @extends reference to missing %s." % (
                        view_def_name, ex)
                view = view_def[ex]
                views.append(view)
            for view in reversed(views):
                local_view.update(view)
            if '@extends' in local_view:
                del local_view['@extends']
            view_def[my_typename] = local_view
        mapper = self.__class__.__mapper__
        relns = {r.key: r for r in mapper.relationships}
        cols = {c.key: c for c in mapper.columns}
        fkeys = {c for c in mapper.columns if c.foreign_keys}
        reln_of_fkeys = {
            frozenset(r._calculated_foreign_keys): r
            for r in mapper.relationships
        }
        fkey_of_reln = {r.key: r._calculated_foreign_keys
                        for r in mapper.relationships}
        methods = dict(pyinspect.getmembers(
            self.__class__, lambda m: pyinspect.ismethod(m)
            and m.func_code.co_argcount == 1))
        properties = dict(pyinspect.getmembers(
            self.__class__, lambda p: pyinspect.isdatadescriptor(p)))
        known = set()
        for name, spec in local_view.iteritems():
            if name == "_default":
                continue
            elif spec is False:
                known.add(name)
                continue
            elif type(spec) is list:
                if not spec:
                    spec = [True]
                assert len(spec) == 1,\
                    "in viewdef %s, class %s, name %s, len(list) > 1" % (
                        view_def_name, my_typename, name)
                subspec = spec[0]
            elif type(spec) is dict:
                assert len(spec) == 1,\
                    "in viewdef %s, class %s, name %s, len(dict) > 1" % (
                        view_def_name, my_typename, name)
                assert "@id" in spec,\
                    "in viewdef %s, class %s, name %s, key should be '@id'" % (
                        view_def_name, my_typename, name)
                subspec = spec["@id"]
            else:
                subspec = spec
            if subspec is True:
                prop_name = name
                view_name = None
            else:
                assert isinstance(subspec, types.StringTypes),\
                    "in viewdef %s, class %s, name %s, spec not a string" % (
                        view_def_name, my_typename, name)
                if subspec[0] == "'":
                    # literals.
                    result[name] = loads(subspec[1:])
                    continue
                if ':' in subspec:
                    prop_name, view_name = subspec.split(':', 1)
                    if not view_name:
                        view_name = view_def_name
                    if not prop_name:
                        prop_name = name
                else:
                    prop_name = subspec
                    view_name = None
            if view_name:
                assert get_view_def(view_name),\
                    "in viewdef %s, class %s, name %s, unknown viewdef %s" % (
                        view_def_name, my_typename, name, view_name)
            #print prop_name, name, view_name

            def translate_to_json(v):
                if isinstance(v, Base):
                    if view_name:
                        return v.generic_json(view_name)
                    else:
                        return v.uri(base_uri)
                elif isinstance(v, (
                        str, unicode, int, long, float, bool, types.NoneType)):
                    return v
                elif isinstance(v, datetime):
                    return v.isoformat()
                elif isinstance(v, dict):
                    return {translate_to_json(k): translate_to_json(v)
                            for k, v in v.items()}
                elif isinstance(v, Iterable):
                    return [translate_to_json(i) for i in v]
                else:
                    raise NotImplementedError("Cannot translate", v)

            if prop_name == 'self':
                if view_name:
                    result[name] = self.generic_json(view_name, base_uri)
                else:
                    result[name] = self.uri()
                continue
            elif prop_name == '@view':
                result[name] = view_def_name
                continue
            elif prop_name[0] == '&':
                prop_name = prop_name[1:]
                assert prop_name in methods,\
                    "in viewdef %s, class %s, name %s, unknown method %s" % (
                        view_def_name, my_typename, name, prop_name)
                # Function call. PLEASE RETURN JSON or Base object.
                val = getattr(self, prop_name)()
                result[name] = translate_to_json(val)
                continue
            elif prop_name in cols:
                assert not view_name,\
                    "in viewdef %s, class %s, viewdef for literal property %s" % (
                        view_def_name, my_typename, prop_name)
                assert not isinstance(spec, list),\
                    "in viewdef %s, class %s, list for literal property %s" % (
                        view_def_name, my_typename, prop_name)
                assert not isinstance(spec, dict),\
                    "in viewdef %s, class %s, dict for literal property %s" % (
                        view_def_name, my_typename, prop_name)
                known.add(prop_name)
                val = getattr(self, prop_name)
                if val is not None:
                    if type(val) == datetime:
                        val = val.isoformat()
                    result[name] = val
                continue
            elif prop_name in properties:
                known.add(prop_name)
                if view_name or (prop_name not in fkey_of_reln) or (
                        relns[prop_name].direction != MANYTOONE):
                    val = getattr(self, prop_name)
                    if val is not None:
                        result[name] = translate_to_json(val)
                else:
                    fkeys = list(fkey_of_reln[prop_name])
                    assert(len(fkeys) == 1)
                    fkey = fkeys[0]
                    result[name] = relns[prop_name].mapper.class_.uri_generic(
                        getattr(self, fkey.key))
                continue
            assert prop_name in relns,\
                    "in viewdef %s, class %s, prop_name %s not a column, property or relation" % (
                        view_def_name, my_typename, prop_name)
            known.add(prop_name)
            # Add derived prop?
            reln = relns[prop_name]
            if reln.uselist:
                vals = getattr(self, prop_name)
                if view_name:
                    if isinstance(spec, dict):
                        result[name] = {
                            ob.uri(base_uri):
                            ob.generic_json(view_name, base_uri)
                            for ob in vals}
                    else:
                        result[name] = [
                            ob.generic_json(view_name, base_uri)
                            for ob in vals]
                else:
                    assert not isinstance(spec, dict),\
                        "in viewdef %s, class %s, dict without viewname for %s" % (
                            view_def_name, my_typename, name)
                    result[name] = [ob.uri(base_uri) for ob in vals]
                continue
            assert not isinstance(spec, dict),\
                "in viewdef %s, class %s, dict for non-list relation %s" % (
                    view_def_name, my_typename, prop_name)
            if view_name:
                ob = getattr(self, prop_name)
                if ob:
                    val = ob.generic_json(view_name, base_uri)
                    if isinstance(spec, list):
                        result[name] = [val]
                    else:
                        result[name] = val
                else:
                    if isinstance(spec, list):
                        result[name] = []
                    else:
                        result[name] = None
            else:
                uri = None
                if len(reln._calculated_foreign_keys) == 1 \
                        and reln._calculated_foreign_keys < fkeys:
                    # shortcut, avoid fetch
                    fkey = list(reln._calculated_foreign_keys)[0]
                    ob_id = getattr(self, fkey.name)
                    if ob_id:
                        uri = reln.mapper.class_.uri_generic(
                            ob_id, base_uri)
                else:
                    ob = getattr(self, prop_name)
                    if ob:
                        uri = ob.uri(base_uri)
                if uri:
                    if isinstance(spec, list):
                        result[name] = [uri]
                    else:
                        result[name] = uri
                else:
                    if isinstance(spec, list):
                        result[name] = []
                    else:
                        result[name] = None

        if local_view.get('_default') is not False:
            for name, col in cols.items():
                if name in known:
                    continue  # already done
                as_rel = reln_of_fkeys.get(frozenset((col, )))
                if as_rel:
                    name = as_rel.key
                    if name in known:
                        continue
                    else:
                        ob_id = getattr(self, col.key)
                        if ob_id:
                            result[name] = as_rel.mapper.class_.uri_generic(
                                ob_id, base_uri)
                        else:
                            result[name] = None
                else:
                    ob = getattr(self, name)
                    if ob:
                        if type(ob) == datetime:
                            ob = ob.isoformat()
                        result[name] = ob
                    else:
                        result[name] = None
        if use_dumps:
            return dumps(result)
        return result

    @classmethod
    def from_json(cls, json, user_id=None):
        inst = cls()
        inst.update_json(json, user_id)
        return inst

    def update_json(self, json, user_id=None):
        raise NotImplementedError()

    @classmethod
    def extra_collections(cls):
        return {}

    def get_owners(self):
        "List of User objects that can be considered owners of this instance"
        return ()

    """The permissions to create, read, update, delete an object of this class.
    Also separate permissions for the owners to update or delete."""
    crud_permissions = CrudPermissions()


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
        parent.__init__(cls, excludes=excludes, **kwargs)


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


class Tombstone(object):
    def __init__(self, ob, **kwargs):
        self.typename = ob.external_typename()
        self.uri = ob.uri()
        self.extra_args = kwargs

    def generic_json(self, *vargs, **kwargs):
        args = {"@type": self.typename,
                "@id": self.uri,
                "@tombstone": True}
        args.update(self.extra_args)
        return args

    def send_to_changes(self, connection):
        assert connection
        if 'cdict' not in connection.info:
            connection.info['cdict'] = {}
        connection.info['cdict'][self.uri] = (
            None, self)


def orm_update_listener(mapper, connection, target):
    if getattr(target, '__history_table__', None):
        return
    session = object_session(target)
    if session.is_modified(target, include_collections=False):
        target.send_to_changes(connection)


def orm_insert_listener(mapper, connection, target):
    if getattr(target, '__history_table__', None):
        return
    target.send_to_changes(connection)


def orm_delete_listener(mapper, connection, target):
    if 'cdict' not in connection.info:
        connection.info['cdict'] = {}
    if getattr(target, '__history_table__', None):
        return
    target.tombstone().send_to_changes(connection)


def before_commit_listener(session):
    # If there hasn't been a flush yet, make sure any sql error occur BEFORE
    # we send changes to the socket.
    session.flush()
    info = session.connection().info
    if 'cdict' in info:
        changes = defaultdict(list)
        for (uri, (discussion, target)) in info['cdict'].iteritems():
            discussion = bytes(discussion or "*")
            json = target.generic_json('changes')
            if json:
                changes[discussion].append(json)
        del info['cdict']
        session.cdict2 = changes
    else:
        print "EMPTY CDICT!"


def after_commit_listener(session):
    if not getattr(session, 'zsocket', None):
        session.zsocket = get_pub_socket()
    if getattr(session, 'cdict2', None):
        for discussion, changes in session.cdict2.iteritems():
            send_changes(session.zsocket, discussion, changes)
        del session.cdict2


def session_rollback_listener(session):
    if getattr(session, 'cdict2', None):
        del session.cdict2


def engine_rollback_listener(connection):
    info = connection.info
    if 'cdict' in connection.info:
        del info['cdict']


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
    global db_schema, _metadata, Base, TimestampedBase, ObsoleteBase, TimestampedObsolete
    db_schema = '.'.join((settings['db_schema'], settings['db_user']))
    _metadata = MetaData(schema=db_schema)
    Base, TimestampedBase = declarative_bases(_metadata, class_registry)
    obsolete = MetaData(schema=db_schema)
    ObsoleteBase, TimestampedObsolete = declarative_bases(obsolete)
    event.listen(Session, 'before_commit', before_commit_listener)
    event.listen(Session, 'after_commit', after_commit_listener)
    event.listen(Session, 'after_rollback', session_rollback_listener)
    event.listen(engine, 'rollback', engine_rollback_listener)
    return engine


def get_model_watcher():
    from .model_watcher import IModelEventWatcher
    return getGlobalSiteManager().queryUtility(IModelEventWatcher)


def is_zopish():
    return isinstance(
        _session_maker.session_factory.kw.get('extension'),
        ZopeTransactionExtension)


def mark_changed():
    z_mark_changed(get_session_maker()())


def get_metadata():
    global _metadata
    return _metadata


def get_named_class(typename):
    global aliased_class_registry
    if not aliased_class_registry:
        aliased_class_registry = {
            cls.external_typename(): cls
            for cls in class_registry.itervalues()
            if getattr(cls, 'external_typename', None)
        }
    return aliased_class_registry.get(typename, None)


# In theory, the identifier should be enough... at some point.
def get_named_object(typename, identifier):
    "Get an object given a typename and identifier"
    # A numeric identifier will often be accepted.
    cls = get_named_class(typename)
    if cls:
        return cls.get_instance(identifier)


def get_database_id(typename, identifier):
    try:
        return int(identifier)
    except ValueError:
        cls = get_named_class(typename)
        if cls:
            return cls.get_database_id(identifier)


def includeme(config):
    """Initialize SQLAlchemy at app start-up time."""
    configure_engine(config.registry.settings)
