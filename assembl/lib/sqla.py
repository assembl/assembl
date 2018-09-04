"""Some utilities for working with SQLAlchemy, and the definition of BaseOps."""

from __future__ import absolute_import

import re
import sys
from datetime import datetime
import inspect as pyinspect
import types
from collections import Iterable, defaultdict
import atexit
from abc import abstractmethod
import logging
from time import sleep
from random import random
from threading import Thread
from contextlib import contextmanager

from enum import Enum
from anyjson import dumps, loads
from colanderalchemy import SQLAlchemySchemaNode
from sqlalchemy import (
    DateTime, MetaData, engine_from_config, event, Column, Integer,
    inspect)
from sqlalchemy.exc import NoInspectionAvailable, OperationalError
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.associationproxy import AssociationProxy
from sqlalchemy.orm import mapper, scoped_session, sessionmaker
from sqlalchemy.orm.interfaces import MANYTOONE, ONETOMANY, MANYTOMANY
from sqlalchemy.orm.properties import RelationshipProperty
from sqlalchemy.orm.util import has_identity
from sqlalchemy.util import classproperty
from sqlalchemy.orm.session import object_session, Session
from sqlalchemy.engine import strategies
from zope.sqlalchemy import ZopeTransactionExtension
from zope.sqlalchemy.datamanager import mark_changed as z_mark_changed
from pyramid.httpexceptions import HTTPUnauthorized, HTTPBadRequest
import transaction
from graphene.relay import Node

from .parsedatetime import parse_datetime
from ..view_def import get_view_def
from .zmqlib import get_pub_socket, send_changes
from ..auth import *
from .decl_enums import EnumSymbol, DeclEnumType
from .utils import get_global_base_url
from ..lib.config import get_config
from ..indexing.reindex import reindex_content

atexit_engines = []
log = logging.getLogger('assembl')


class CrudOperation(Enum):
    DELETE = -1
    UPDATE = 0
    CREATE = 1


class DuplicateHandling(Enum):
    """How to handle duplicates. Assumes that the unique_query is valid."""
    NO_CHECK = 1        # Don't look for duplicates
    ERROR = 2           # raise a ObjectNotUniqueError
    USE_ORIGINAL = 3    # Update the original value instead of a new one.
    TOMBSTONE = 4       # Tombstone the original value (assumes TombstonableMixin) and use new one
    TOMBSTONE_AND_COPY = 5  # Make a tombstone of original value, and reuse it


class ObjectNotUniqueError(ValueError):
    pass


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


def get_target_class(column):
    global class_registry
    # There should be an easier way???
    fk = next(iter(column.foreign_keys))
    target_table = fk.column.table
    for cls in class_registry.itervalues():
        if cls.__mapper__.__table__ == target_table:
            return cls


class DummyContext(object):
    def __init__(self, presets=None):
        self.presets = presets or {}

    def get_instance_of_class(self, cls):
        return self.presets.get(cls, None)


class ChainingContext(object):
    def __init__(self, context, instance):
        self.context = context
        self.instance = instance

    def get_instance_of_class(self, cls):
        if isinstance(self.instance, cls):
            return self.instance
        return self.context.get_instance_of_class(cls)


class TableLockCreationThread(Thread):
    """Utility class to create objects as a side effect.
    Will use an exclusive table lock to ensure that the objects
    are created only once. Does it on another thread to minimize
    the time that the table is locked. Not all object creation should
    need this, but it should be used when many connexions might attempt
    to create the same unique objects.

    :param func object_generator: a function (w/o parameters) that will
        create the objects that need to be created (as iterable).
        They will be added and committed in a subtransaction.
        Will be called many times.
    :returns: Whether there was anything added (maybe not in this process)
    """
    def __init__(self, object_generator, lock_table_name, num_attempts=3):
        super(TableLockCreationThread, self).__init__()
        self.object_generator = object_generator
        self.lock_table_name = lock_table_name
        self.num_attempts = num_attempts
        self.success = None
        self.created = False

    def run(self):
        session_maker = get_session_maker()
        try:
            for num in range(self.num_attempts):
                db = session_maker()
                # Get the ThreadTransactionManager in a quite horrible way.
                tm = getattr(session_maker.session_factory.kw['extension'],
                             'transaction_manager', None)
                if tm is None:
                    # Ad hoc transaction manager. TODO: Use existing machinery.
                    # This is only used in testing, though.

                    @contextmanager
                    def CommittingTm(db):
                        try:
                            yield
                        except Exception as e:
                            db.rollback()
                            raise e
                        db.commit()
                    tm = CommittingTm(db)
                with tm:
                    try:
                        db.execute("LOCK TABLE %s IN EXCLUSIVE MODE NOWAIT" % (
                            self.lock_table_name,))
                    except OperationalError as e:
                        log.info("Could not get the table lock in attempt %d"
                                 % (num,))
                        sleep(random() / 10.0)
                        continue
                    # recalculate needed objects.
                    # There may be none left after having obtained the lock.
                    to_be_created = self.object_generator()
                    for ob in to_be_created:
                        self.created = True
                        db.add(ob)
                # implicit commit of subtransaction
                # We _should_ get the transient error reraised if we keep failing.
                self.success = True
        except ObjectNotUniqueError as e:
            # Should not happen anymore. Log if so.
            self.success = False
            log.error("locked_object_creation: the generator created "
                      "a non-unique object despite locking." + str(e))
            self.exception = e
        except Exception as e:
            print e
            self.success = False
            self.exception = e


class BaseOps(object):
    """Base class for SQLAlchemy models in Assembl.

    Many protocols are defined here.

    """


    # @declared_attr
    # def __tablename__(cls):
    #     """Return a table name made out of the model class name."""
    #     return _TABLENAME_RE.sub(r'_\1', cls.__name__).strip('_').lower()

    @classproperty
    def default_db(cls):
        """Return the global SQLAlchemy db session maker object.

        We often use this when we have no instance.db available;
        but it may be a different session and create instances on that other
        session, leading to obscure bugs in object relationships.
        Try to pass a session around if you need to rely on relationships.
        """
        assert _session_maker is not None
        return _session_maker

    @property
    def db(self):
        """Return the SQLAlchemy db session object. (per-http-request)"""
        return inspect(self).session or self.default_db()

    @property
    def object_session(self):
        return object_session(self)

    @classproperty
    def full_schema(cls):
        config = get_config()
        return config.get('db_schema')

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
        Not used at this point.

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
    def is_new_instance(self):
        """Return True if the instance wasn't fetched from the database."""
        return not has_identity(self)

    @classmethod
    def create(cls, obj=None, flush=False, **values):
        """Create an instance. Not used."""
        if obj is None:
            obj = cls(**values)
        else:
            obj.update(**values)
        obj.save(flush)
        return obj

    @classmethod
    def get_by(cls, raise_=False, **criteria):
        """Return the record corresponding to the criteria.

        Throw an exception on record not found and `raise_` == True, else
        return None.
        """
        q = _session_maker.query(cls).filter_by(**criteria)
        return raise_ and q.one() or q.first()

    @classmethod
    def get(cls, id, session=None):
        """Return the record by id."""
        session = session or cls.default_db
        return session.query(cls).get(id)

    @classmethod
    def find(cls, **criteria):
        return _session_maker.query(cls).filter_by(**criteria).all()

    def delete(self):
        _session_maker.delete(self)

    @classmethod
    def polymorphic_identities(cls):
        """Return the list of polymorphic identities defined in subclasses."""
        return [k for (k, v) in cls.__mapper__.polymorphic_map.iteritems()
                if issubclass(v.class_, cls)]

    @classmethod
    def polymorphic_filter(cls):
        """Return a SQLA expression that tests for subclasses of this class"""
        return cls.__mapper__.polymorphic_on.in_(cls.polymorphic_identities())

    def update(self, **values):
        fields = self._col_names()
        for name, value in values.iteritems():
            if name in fields:
                setattr(self, name, value)

    def save(self, flush=False):
        """Encapsulate db.add()."""
        if self.is_new_instance:
            _session_maker.add(self)
        if flush:
            _session_maker.flush()

    @classmethod
    def inject_api(cls, name, as_object=False):
        """Inject common methods in an API module. Unused."""
        class API(object):
            pass
        container = API() if as_object else sys.modules[name]

        for attr in 'create', 'get', 'find', 'validator':
            setattr(container, attr, getattr(cls, attr))

        if as_object:
            return container

    def get_id_as_str(self):
        """Return the primary key as a string."""
        id = getattr(self, 'id', None)
        if id is None:
            if 'id' not in self.__class__.__dict__:
                raise NotImplementedError("get_id_as_str on " +
                    self.__class__.__name__)
            return None
        return str(id)

    def tombstone(self):
        """Return a :py:class:`Tombstone` object.

        This object will be sent on the websocket
        and will express that this object has been deleted."""
        return Tombstone(self)

    def send_to_changes(self, connection=None, operation=CrudOperation.UPDATE,
                        discussion_id=None, view_def="changes"):
        """Ask for this object to be sent on the changes websocket.

        See :py:mod:`assembl.tasks.changes_router`."""
        if not connection:
            # WARNING: invalidate has to be called within an active transaction.
            # This should be the case in general, no need to add a transaction manager.
            connection = self.db.connection()
        if 'cdict' not in connection.info:
            connection.info['cdict'] = {}
        connection.info['cdict'][(self.uri(), view_def)] = (
            discussion_id, self)

    @classmethod
    def external_typename(cls):
        """What is the class name that will be sent on the API, as @type.

        Usually the python class name directly."""
        return cls.__name__

    def __repr__(self):
        return "<%s id=%d >" % (
            self.external_typename(), getattr(self, 'id', None) or -1)

    @classmethod
    def base_polymorphic_class(cls):
        """Returns the base class of this class above Base."""
        mapper_args = getattr(cls, '__mapper_args__', {})
        if mapper_args.get('polymorphic_identity', None) is not None:
            for nextclass in cls.mro():
                if getattr(nextclass, '__mapper__', None) is None:
                    break
                if nextclass.__mapper__.polymorphic_identity is not None:
                    cls = nextclass
        return cls

    @classmethod
    def external_typename_with_inheritance(cls):
        """Returns the :py:meth:`external_typename` of the root class below this one."""
        return cls.base_polymorphic_class().external_typename()

    @classmethod
    def graphene_type(cls):
        return cls.__name__

    @classmethod
    def graphene_id_for(cls, id):
        return Node.to_global_id(cls.graphene_type(), id)

    def graphene_id(self):
        return self.graphene_id_for(self.id)

    @classmethod
    def uri_generic(cls, id, base_uri='local:'):
        """Return the identity of this object as a URI in the `local:` namespace

        Composed from the root type name and database Id.
        The local: namespace actually corresponds to the server name,
        and is intended to become the basis of a LOD architecture."""
        if id is None:
            return None
        return base_uri + cls.external_typename_with_inheritance() + "/" + str(id)

    @classmethod
    def base_conditions(cls, alias=None, alias_maker=None):
        """Return a list of SQLA expressions that will filter out
        instances of this class

        Mostly used to exclude archived versions; see :py:mod:`assembl.lib.history_mixin`
        The exclusion pattern is used by the traversal API, and by the RDF mapping."""
        return None

    @classmethod
    def get_instance(cls, identifier, session=None):
        """Get an instance of this class using a numeric ID or URI.
        Will try a few schemes and may return None.
        Code defensively downstream."""
        try:
            # temporary hack
            num = int(identifier)
        except ValueError:
            num = cls.get_database_id(identifier)
        if num:
            # reimplement get, because can be subclassed
            session = session or cls.default_db
            return session.query(cls).get(num)

    @classmethod
    def get_database_id(cls, uri):
        """Parse a URI to extract the database ID
        Will try a few schemes and may return None.
        Code defensively downstream."""
        if isinstance(uri, types.StringTypes):
            if uri.startswith('local:') and '/' in uri:
                uriclsname, num = uri[6:].split('/', 1)
            else:
                try:
                    uriclsname, num = Node.from_global_id(uri)
                except Exception as e:
                    return
            uricls = get_named_class(uriclsname)
            if not uricls:
                return
            if uricls == cls or uricls in cls.mro() or cls in uricls.mro():
                try:
                    return int(num)
                except ValueError:
                    pass

    def uri(self, base_uri='local:'):
        """The URI of this instance.

        It may be a LOD URL if the namespace is resolved."""
        return self.uri_generic(self.get_id_as_str(), base_uri)

    @classmethod
    def get_subclasses(cls):
        """Return the list of subclasses of this class"""
        global class_registry
        from inspect import isclass
        return (c for c in class_registry.itervalues()
                if isclass(c) and issubclass(c, cls))

    @classmethod
    def get_inheritance(cls):
        """Return a dictionary of external class names to their parent classe's name."""
        name = cls.external_typename()
        inheritance = {}
        for subclass in cls.get_subclasses():
            subclass_name = subclass.external_typename()

            if subclass_name == name:
                continue
            for supercls in subclass.mro()[1:]:
                if not supercls.__dict__.get('__mapper_args__', {}).get('polymorphic_identity', None):
                    continue
                superclass_name = supercls.external_typename()
                inheritance[subclass_name] = superclass_name
                if (superclass_name == name
                        or superclass_name in inheritance):
                    break
                subclass_name = superclass_name
        return inheritance

    @staticmethod
    def get_json_inheritance_for(*classnames):
        """Return :py:meth:`get_inheritance` as a json string"""
        inheritance = {}
        classnames = set(classnames)
        for name in classnames:
            cls = get_named_class(name)
            inheritance.update(cls.get_inheritance())
        return dumps(inheritance)

    retypeable_as = ()
    """If it is possible to mutate the class of this object after its creation,
    using :py:meth:BaseOps.change_class,
    declare here the list of classes it can be retyped into"""

    def change_class(self, newclass, json=None, **kwargs):
        """Change the class of an instance, deleting and creating table rows as needed."""
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
        json = json or {}

        for table in newclass_tables:
            col_names = {c.key for c in table.c if not c.primary_key}
            local_kwargs = {k: kwargs.get(k, json.get(k, None))
                            for k in col_names}
            db.execute(table.insert().values(id=id, **local_kwargs))

        new_object = db.query(newclass).get(id)
        new_object.send_to_changes()
        return new_object

    @classmethod
    def expand_view_def(cls, view_def):
        """Return the full view_def specification for this class.

        Follows the @extend links and the _default view."""
        local_view = None
        for cls in cls.mro():
            if cls.__name__ == 'Base':
                return None
            if not issubclass(cls, BaseOps):
                # mixin
                continue
            my_typename = cls.external_typename()
            local_view = view_def.get(my_typename, None)
            if local_view is False:
                return False
            if local_view is not None:
                break
        else:
            # we never found a view
            return None
        assert isinstance(local_view, dict),\
            "in viewdef, definition for class %s is not a dict" % (
                my_typename)
        if '_default' not in local_view:
            view = local_view
            views = [view]
            local_view = dict(view_def.get('_default', {'_default': False}))
            while '@extends' in view:
                ex = view['@extends']
                assert ex in view_def,\
                    "In viewdef @extends reference to missing %s." % (ex,)
                view = view_def[ex]
                views.append(view)
            for view in reversed(views):
                local_view.update(view)
            if '@extends' in local_view:
                del local_view['@extends']
            view_def[my_typename] = local_view
        return local_view

    def generic_json(
            self, view_def_name='default', user_id=None,
            permissions=(P_READ, ), base_uri='local:'):
        """Return a representation of this object as a JSON object,
        according to the given view_def and access control."""
        user_id = user_id or Everyone
        if not self.user_can(user_id, CrudPermissions.READ, permissions):
            return None
        view_def = get_view_def(view_def_name or 'default')
        my_typename = self.external_typename()
        result = {}
        local_view = self.expand_view_def(view_def)
        if not local_view:
            return None
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
                    p = getattr(v, 'user_can', None)
                    if p and not v.user_can(
                            user_id, CrudPermissions.READ, permissions):
                        return None
                    if view_name:
                        return v.generic_json(
                            view_name, user_id, permissions, base_uri)
                    else:
                        return v.uri(base_uri)
                elif isinstance(v, (
                        str, unicode, int, long, float, bool, types.NoneType)):
                    return v
                elif isinstance(v, EnumSymbol):
                    return v.name
                elif isinstance(v, datetime):
                    return v.isoformat() + "Z"
                elif isinstance(v, dict):
                    v = {translate_to_json(k): translate_to_json(val)
                         for k, val in v.items()}
                    return {k: val for (k, val) in v.items()
                            if val is not None}
                elif isinstance(v, Iterable):
                    v = [translate_to_json(i) for i in v]
                    return [x for x in v if x is not None]
                else:
                    raise NotImplementedError("Cannot translate", v)

            if prop_name == 'self':
                if view_name:
                    r = self.generic_json(
                        view_name, user_id, permissions, base_uri)
                    if r is not None:
                        result[name] = r
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
                # Function call. PLEASE RETURN JSON, Base objects,
                # or list or dicts thereof
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
                    val = translate_to_json(val)
                if val is not None:
                    result[name] = val
                continue
            elif prop_name in properties:
                known.add(prop_name)
                if view_name or (prop_name not in fkey_of_reln) or (
                        relns[prop_name].direction != MANYTOONE):
                    val = getattr(self, prop_name)
                    if val is not None:
                        val = translate_to_json(val)
                    if val is not None:
                        result[name] = val
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
                            ob.generic_json(
                                view_name, user_id, permissions, base_uri)
                            for ob in vals
                            if ob.user_can(
                                user_id, CrudPermissions.READ, permissions)}
                    else:
                        result[name] = [
                            ob.generic_json(
                                view_name, user_id, permissions, base_uri)
                            for ob in vals
                            if ob.user_can(
                                user_id, CrudPermissions.READ, permissions)]
                else:
                    assert not isinstance(spec, dict),\
                        "in viewdef %s, class %s, dict without viewname for %s" % (
                            view_def_name, my_typename, name)
                    result[name] = [
                        ob.uri(base_uri) for ob in vals
                        if ob.user_can(
                            user_id, CrudPermissions.READ, permissions)]
                continue
            assert not isinstance(spec, dict),\
                "in viewdef %s, class %s, dict for non-list relation %s" % (
                    view_def_name, my_typename, prop_name)
            if view_name:
                ob = getattr(self, prop_name)
                if ob and ob.user_can(
                        user_id, CrudPermissions.READ, permissions):
                    val = ob.generic_json(
                        view_name, user_id, permissions, base_uri)
                    if val is not None:
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
                            ob = ob.isoformat() + "Z"
                        result[name] = ob
                    else:
                        result[name] = None
        return result

    dummy_context = DummyContext()

    def locked_object_creation(
            self, object_generator, lock_table_cls=None, num_attempts=3):
        """Utility method to create objects as a side effect.
        Will use an exclusive table lock to ensure that the objects
        are created only once. Not all object creation should need this,
        but it should be used when many connexions might attempt to create
        the same unique objects.

        :param func object_generator: a function (w/o parameters) that will
            create the objects that need to be created (as iterable).
            They will be added and committed in a subtransaction.
            Will be called many times.
        :returns: Whether there was anything added (maybe not in this process)
        """
        lock_table_cls = lock_table_cls or self.__class__
        lock_table_name = lock_table_cls.__mapper__.local_table.name
        to_be_created = object_generator()
        if not to_be_created:
            return False
        # Do this on another thread to minimize lock time.
        operation = TableLockCreationThread(
            object_generator, lock_table_name, num_attempts)
        operation.start()
        operation.join()
        if operation.success is False:
            raise operation.exception
        return operation.created

    def _create_subobject_from_json(
            self, json, target_cls, parse_def, aliases,
            context, permissions, user_id, accessor_name,
            jsonld=None):
        instance = None
        target_type = json.get('@type', None)
        if target_type:
            new_target_cls = get_named_class(target_type)
            if target_cls is not None and \
                    not issubclass(new_target_cls, target_cls):
                raise HTTPBadRequest(
                    "Type %s was assigned to %s.%s" % (
                        target_type, self.__class__.__name__,
                        accessor_name))
            target_cls = new_target_cls
        if not target_cls:
            # Not an instance
            return None
        target_id = json.get('@id', None)
        if target_id is not None:
            if isinstance(target_id, (str, unicode)):
                instance = aliases.get(target_id, None)
                if instance is None:
                    instance = get_named_object(
                        target_id, target_cls.external_typename())
                    if instance is not None:
                        aliases[target_id] = instance
        if instance is not None:
            # NOTE: Here we could tombstone the instance if tombstonable.
            instance._do_update_from_json(
                json, parse_def, aliases, context, permissions,
                user_id, DuplicateHandling.USE_ORIGINAL, jsonld)
        else:
            instance = target_cls._do_create_from_json(
                json, parse_def, aliases, context, permissions,
                user_id, DuplicateHandling.USE_ORIGINAL, jsonld)
            if instance is None:
                raise HTTPBadRequest(
                    "Could not find or create object %s" % (
                        dumps(json),))
        if target_id is not None:
            aliases[target_id] = instance
        return instance

    # If a duplicate is created, do we use the original? (Error otherwise)
    default_duplicate_handling = DuplicateHandling.ERROR

    # Cases: Create -> no duplicate. Sub-elements are created or found.
    # Update-> no duplicate. Sub-elements are created or found.
    # do we store aliases? (not yet.)
    # We need to give the parse_def (by name or by value?)
    @classmethod
    def create_from_json(
            cls, json, user_id=None, context=None,
            aliases=None, jsonld=None, permissions=None,
            parse_def_name='default_reverse', duplicate_handling=None):
        """Create an object from its JSON representation."""
        from ..auth.util import get_permissions
        aliases = aliases or {}
        parse_def = get_view_def(parse_def_name)
        context = context or cls.dummy_context
        user_id = user_id or Everyone
        from assembl.models import Discussion
        discussion = context.get_instance_of_class(Discussion)
        permissions = permissions or get_permissions(
            user_id, discussion.id if discussion else None)
        with cls.default_db.no_autoflush:
            # We need this to allow db.is_modified to work well
            return cls._do_create_from_json(
                json, parse_def, aliases, context, permissions,
                user_id, duplicate_handling, jsonld)

    @classmethod
    def _do_create_from_json(
            cls, json, parse_def, aliases, context, permissions,
            user_id, duplicate_handling=None, jsonld=None):
        duplicate_handling = \
            duplicate_handling or cls.default_duplicate_handling
        can_create = cls.user_can_cls(
            user_id, CrudPermissions.CREATE, permissions)
        if duplicate_handling == DuplicateHandling.ERROR and not can_create:
            raise HTTPUnauthorized(
                "User id <%s> cannot create a <%s> object" % (
                    user_id, cls.__name__))
        # creating an object can be a weird way to find an object by attributes
        inst = cls()
        result = inst._do_update_from_json(
            json, parse_def, aliases, context, permissions,
            user_id, duplicate_handling, jsonld)
        if result is inst and not can_create:
            raise HTTPUnauthorized(
                "User id <%s> cannot create a <%s> object" % (
                    user_id, cls.__name__))
        elif result is not inst and \
            not result.user_can(
                user_id, CrudPermissions.UPDATE, permissions
                ) and cls.default_db.is_modified(result, False):
            raise HTTPUnauthorized(
                "User id <%s> cannot modify a <%s> object" % (
                    user_id, cls.__name__))
        if result is not inst:
            cls.default_db.add(result)
            result_id = result.uri()
            if '@id' in json and result_id != json['@id']:
                aliases[json['@id']] = result
        return result

    def update_from_json(
                self, json, user_id=None, context=None, jsonld=None,
                permissions=None, parse_def_name='default_reverse'):
        """Update (patch) an object from its JSON representation."""
        from ..auth.util import get_permissions
        parse_def = get_view_def(parse_def_name)
        context = context or self.dummy_context
        user_id = user_id or Everyone
        from assembl.models import DiscussionBoundBase, Discussion
        discussion = context.get_instance_of_class(Discussion)
        if not discussion and isinstance(self, DiscussionBoundBase):
            discussion = Discussion.get(self.get_discussion_id())
        if permissions is None:
            permissions = get_permissions(
                user_id, discussion.id if discussion else None)
        if not self.user_can(
                user_id, CrudPermissions.UPDATE, permissions):
            raise HTTPUnauthorized(
                "User id <%s> cannot modify a <%s> object" % (
                    user_id, self.__class__.__name__))
        with self.db.no_autoflush:
            # We need this to allow db.is_modified to work well
            return self._do_update_from_json(
                json, parse_def, {}, context, permissions, user_id,
                None, jsonld)

    # TODO: Add security by attribute?
    # Some attributes may be settable only on create.
    def _do_update_from_json(
            self, json, parse_def, aliases, context, permissions,
            user_id, duplicate_handling=None, jsonld=None):
        assert isinstance(json, dict)
        jsonld = jsonld or {}
        is_created = self.id is None
        typename = json.get("@type", None)
        if typename and typename != self.external_typename() and \
                typename in self.retypeable_as:
            # MORE security checks?
            new_cls = get_named_class(typename)
            assert new_cls
            recast = self.change_class(new_cls, json)
            return recast._do_update_from_json(
                json, parse_def, aliases, context, permissions,
                user_id, duplicate_handling, jsonld)
        local_view = self.expand_view_def(parse_def)
        # False means it's illegal to get this.
        assert local_view is not False
        # None means no specific instructions.
        local_view = local_view or {}
        mapper = inspect(self.__class__)
        treated_foreign_keys = set()
        treated_relns = set()
        # Also: Pre-visit the json to associate @ids to dicts
        # because the object may not be ready in the aliases yet
        for key, value in json.iteritems():
            if key in local_view:
                parse_instruction = local_view[key]
            else:
                parse_instruction = local_view.get('_default', False)
            if parse_instruction is False:
                # Ignore
                continue
            elif parse_instruction is True:
                pass
            elif isinstance(parse_instruction, list):
                # List specification is redundant in parse_defs.
                # These cases should always be handled as relations.
                raise NotImplementedError()
            elif parse_instruction[0] == '&':
                setter = getattr(
                    self.__class__, parse_instruction[1:], None)
                if not setter:
                    raise HTTPBadRequest("No setter %s in class %s" % (
                        parse_instruction[1:], self.__class__.__name__))
                if not pyinspect.ismethod(setter):
                    raise HTTPBadRequest("Not a setter: %s in class %s" % (
                        parse_instruction[1:], self.__class__.__name__))
                (args, varargs, keywords, defaults) = \
                    pyinspect.getargspec(setter)
                if len(args) - len(defaults or ()) != 2:
                    raise HTTPBadRequest(
                        "Wrong number of args: %s(%d) in class %s" % (
                            parse_instruction[1:], len(args),
                            self.__class__.__name__))
                setter(self, value)
            elif parse_instruction[0] == "'":
                if value != parse_instruction[1:]:
                    raise HTTPBadRequest("%s should be %s'" % (
                        key, parse_instruction))
            else:
                key = parse_instruction
            accessor = None
            accessor_name = key
            target_cls = None
            can_be_list = False
            must_be_list = False
            instance = None
            instances = []
            # First treat scalars
            if key in mapper.c:
                col = mapper.c[key]
                if value is None:
                    if not col.nullable:
                        raise HTTPBadRequest(
                            "%s is not nullable" % (key,))
                    setattr(self, key, value)
                    continue
                if not col.foreign_keys:
                    if isinstance(value, (str, unicode)):
                        target_type = col.type.__class__
                        if target_type == DateTime:
                            setattr(self, key, parse_datetime(value, True))
                        elif isinstance(col.type, DeclEnumType):
                            setattr(self, key, col.type.enum.from_string(value))
                        elif col.type.python_type is unicode \
                                and isinstance(value, str):
                            setattr(self, key, value.decode('utf-8'))
                        elif col.type.python_type is str \
                                and isinstance(value, unicode):
                            setattr(self, key, value.encode('ascii'))  # or utf-8?
                        elif col.type.python_type is bool \
                                and value.lower() in ("true", "false"):
                            # common error... tolerate.
                            setattr(self, key, value.lower() == "true")
                        elif col.type.python_type in (str, unicode):
                            setattr(self, key, value)
                        else:
                            assert False, "can't assign json type %s"\
                                " to column %s of class %s" % (
                                    type(value).__name__, col.key,
                                    self.__class__.__name__)
                    elif isinstance(value, col.type.python_type):
                        setattr(self, key, value)
                    else:
                        assert False, "can't assign json type %s"\
                            " to column %s of class %s" % (
                                type(value).__name__, col.key,
                                self.__class__.__name__)
                    continue
                else:
                    # Non-scalar
                    # TODO: Keys spanning multiple columns
                    fk = next(iter(col.foreign_keys))
                    orm_relns = filter(
                        lambda r: col in r.local_columns
                        and r.secondary is None,
                        mapper.relationships)
                    assert(len(orm_relns) <= 1)
                    if orm_relns:
                        accessor = next(iter(orm_relns))
                        accessor_name = accessor.key
                        target_cls = accessor.mapper.class_
                    else:
                        accessor = col
                        # Costly. TODO: Optimize.
                        target_cls = get_target_class(col)
            elif key in mapper.relationships:
                accessor = mapper.relationships[key]
                target_cls = accessor.mapper.class_
                if accessor.direction == MANYTOMANY:
                    raise NotImplementedError()
                elif accessor.direction == ONETOMANY and accessor.uselist:
                    can_be_list = must_be_list = True
            elif getattr(self.__class__, key, None) is not None and\
                    isinstance(getattr(self.__class__, key), property) and\
                    getattr(getattr(
                        self.__class__, key), 'fset', None) is None:
                raise HTTPBadRequest(
                    "No setter for property %s of type %s" % (
                        key, json.get('@type', '?')))
            elif getattr(self.__class__, key, None) is not None and\
                    isinstance(getattr(self.__class__, key), property):
                accessor = getattr(self.__class__, key)
                can_be_list = True
            elif getattr(self.__class__, key, None) is not None\
                    and isinstance(getattr(self.__class__, key),
                                   AssociationProxy):
                accessor = getattr(self.__class__, key)
                # Target_cls?
                can_be_list = must_be_list = True
            elif not value:
                print "Ignoring unknown empty value for "\
                    "attribute %s in json id %s (type %s)" % (
                        key, json.get('@id', '?'), json.get('@type', '?'))
                continue
            else:
                raise HTTPBadRequest(
                    "Unknown attribute %s in json id %s (type %s)" % (
                        key, json.get('@id', '?'), json.get('@type', '?')))

            # We have an accessor, let's treat the value.
            c_context = ChainingContext(context, self)
            if isinstance(value, (str, unicode)):
                assert not must_be_list
                target_id = value
                if target_cls is not None and \
                        isinstance(target_id, (str, unicode)):
                    instance = aliases.get(target_id, None)
                    # TODO: Keys spanning multiple columns
                    if instance is None:
                        instance = get_named_object(
                            target_id, target_cls.external_typename())
                        if instance is not None:
                            aliases[target_id] = instance
                    if instance is None and target_id in jsonld:
                        instance = _create_subobject_from_json(
                            jsonld[target_id], target_cls, parse_def,
                            aliases, c_context, permissions, user_id,
                            accessor, jsonld)
                        aliases[target_id] = instance
                    if instance is None:
                        raise HTTPBadRequest("Could not find object "+value)
                else:
                    # Possibly just a string
                    instance = target_id
            elif isinstance(value, dict):
                assert not must_be_list
                instance = self._create_subobject_from_json(
                    value, target_cls, parse_def, aliases,
                    c_context, permissions, user_id, accessor_name,
                    jsonld)
                if instance is None:
                    if isinstance(accessor, property):
                        # It may not be an object after all
                        setattr(self, key, value)
                        continue
                    raise RuntimeError(
                        "Could not create a sub-object from "+str(dict))
            elif isinstance(value, list):
                assert can_be_list
                for subval in value:
                    if isinstance(subval, (str, unicode)):
                        instance = aliases.get(subval, None)
                        if instance is None:
                            instance = get_named_object(
                                subval, target_cls.external_typename())
                            if instance is not None:
                                aliases[subval] = instance
                        if instance is None and subval in jsonld:
                            instance = _create_subobject_from_json(
                                jsonld[subval], target_cls, parse_def,
                                aliases, c_context, permissions, user_id,
                                accessor, jsonld)
                            aliases[subval] = instance
                        if instance is None:
                            raise HTTPBadRequest(
                                "Could not find object %s" % (
                                    subval,))
                        # TODO: Keys spanning multiple columns
                    elif isinstance(subval, dict):
                        instance = self._create_subobject_from_json(
                            subval, target_cls, parse_def, aliases,
                            c_context, permissions, user_id, accessor_name,
                            jsonld)
                        if instance is None:
                            raise HTTPBadRequest("No @class in "+dumps(subval))
                    else:
                        raise
                    instances.append(instance)
                    if isinstance(accessor, RelationshipProperty) \
                            and accessor.back_populates is not None:
                        # TODO: check update permissions on that object.
                        setattr(instance, accessor.back_populates, self)
                # Deal with list case here.
                if isinstance(accessor, RelationshipProperty):
                    if not accessor.back_populates:
                        # Try the brutal approach
                        setattr(self, accessor_name, instances)
                    else:
                        from ..lib.history_mixin import TombstonableMixin
                        current_instances = getattr(self, accessor_name)
                        missing = set(instances) - set(current_instances)
                        if missing:
                            # Maybe tombstones
                            missing = filter(lambda a: not isinstance(a, TombstonableMixin) or not a.is_tombstone, missing)
                        assert not missing, "what's wrong with back_populates?"
                        extra = set(current_instances) - set(instances)
                        if extra:
                            remote_columns = list(accessor.remote_side)
                            if len(accessor.remote_side) > 1:
                                if issubclass(accessor.mapper.class_, TombstonableMixin):
                                    remote_columns = filter(lambda c: c.name != 'tombstone_date', remote_columns)
                            assert len(remote_columns) == 1
                            remote = remote_columns[0]
                            if remote.nullable:
                                # TODO: check update permissions on that object.
                                for inst in missing:
                                    setattr(inst, remote.key, None)
                            else:
                                for inst in extra:
                                    if not inst.user_can(
                                            user_id, CrudPermissions.DELETE,
                                            permissions):
                                        raise HTTPUnauthorized(
                                            "Cannot delete object %s", inst.uri())
                                    else:
                                        if isinstance(inst, TombstonableMixin):
                                            inst.is_tombstone = True
                                        else:
                                            self.db.delete(inst)
                elif isinstance(accessor, property):
                    setattr(self, accessor_name, instances)
                elif isinstance(accessor, Column):
                    raise HTTPBadRequest(
                        "%s cannot have multiple values" % (key, ))
                elif isinstance(accessor, AssociationProxy):
                    current_instances = getattr(self, accessor_name)
                    missing = set(instances) - set(current_instances)
                    extra =  set(current_instances) - set(instances)
                    for inst in missing:
                        accessor.add(inst)
                    for inst in extra:
                        accessor.remove(inst)
                continue
            elif isinstance(accessor, property):
                # Property can be any target type.
                # Hence we do not handle well the case of simple
                # string or dict properties
                setattr(self, accessor_name, value)
                continue
            elif value is None:
                # We used to not clear. That was silly, but doing it may
                # be dangerous.
                setattr(self, accessor_name, None)
                # Note: also null the column, because that's what is used
                # to compute the output json.
                for col in accessor.local_columns:
                    # check because otherwise it's spuriously set as modified
                    if getattr(self, col.name, None):
                        setattr(self, col.name, None)
                treated_relns.add(accessor)
                continue
            else:
                assert False, "can't assign json type %s"\
                    " to relationship %s of class %s" % (
                        type(value).__name__, accessor_name,
                        self.__class__.__name__)

            # Now we have an instance and an accessor, let's assign.
            # Case of list taken care of.
            if isinstance(accessor, RelationshipProperty):
                # Let it throw an exception if reln not nullable?
                # Or would that come too late?
                setattr(self, accessor_name, instance)
                # Note: also set the column, because that's what is used
                # to compute the output json.
                if len(accessor.local_columns) == 1:
                    for col in accessor.local_columns:
                        setattr(self, col.name, instance.id)
                else:
                    raise RuntimeError("Multiple column relationship not handled yet")
                treated_relns.add(accessor)
            elif isinstance(accessor, property):
                setattr(self, accessor_name, instance)
            elif isinstance(accessor, Column):
                if instance is None:
                    if not accessor.nullable:
                        raise HTTPBadRequest(
                            "%s is not nullable" % (accessor_name,))
                else:
                    fk = next(iter(accessor.foreign_keys))
                    instance_key = getattr(instance, fk.column.key)
                    if instance_key is not None:
                        setattr(self, accessor_name, instance_key)
                    else:
                        # Maybe delay and flush after identity check?
                        raise NotImplementedError()
            elif isinstance(accessor, AssociationProxy):
                # only for lists, I think
                assert False, "we should not get here"
            else:
                assert False, "we should not get here"

        # Now look for missing relationships
        for reln in mapper.relationships:
            if reln in treated_relns:
                continue
            if all((col in treated_foreign_keys
                    for col in reln.local_columns)):
                continue
            # Only non-nullable relationships. Otherwise I get conflicts
            if all((col.nullable and col.info.get("pseudo_nullable", True)
                    for col in reln.local_columns)):
                continue
            if reln.direction != MANYTOONE:
                # only direct relations
                continue
            if getattr(self, reln.key, None) is None:
                from assembl.models.auth import AgentProfile, User
                target_class = reln.mapper.class_
                # Hack: if it's a user relationship, assume owner.
                # TODO: Make ownership reln explicit, we had an issue
                # with moderator.
                # TODO: Subclasses of user.
                if user_id != Everyone and issubclass(
                        target_class, AgentProfile):
                    if any([
                            issubclass(AgentProfile, r.mapper.class_)
                            for r in treated_relns]):
                            # User is already treated
                        continue
                    instance = User.get(user_id)
                else:
                    instance = context.get_instance_of_class(target_class)
                    if instance is self:
                        continue
                if instance is not None:
                    print "extra relation assignment", reln.key, instance
                    setattr(self, reln.key, instance)
        return self.handle_duplication(
            json, parse_def, aliases, context, permissions, user_id,
            duplicate_handling, jsonld)

    def handle_duplication(
                self, json={}, parse_def={}, aliases={}, context=None,
                permissions=[], user_id=None, duplicate_handling=None,
                jsonld=None, form_data=None):
        """Look for duplicates of this object.

        Some uniqueness is handled in the database, but it is difficult to do
        across tables. Often we will use the classe's unique_query to find an
        duplicate, and react appropriately here. Appropriateness depends on
        the classe's `default_duplicate_handling`, which can be overridden."""
        from .history_mixin import TombstonableMixin, HistoryMixin
        if duplicate_handling is None:
            duplicate_handling = self.default_duplicate_handling
        if duplicate_handling == DuplicateHandling.NO_CHECK:
            return
        # Issue: unique_query MAY trigger a flush, which will
        # trigger an error if columns are missing, including in a call above.
        # But without the flush, some relations will not be interpreted
        # correctly. Strive to avoid the flush in most cases.
        unique_query, usable = self.unique_query()
        if usable:
            others = unique_query.all()
            if self in others:
                others.remove(self)
            if others:
                if duplicate_handling == DuplicateHandling.TOMBSTONE:
                    for other in others:
                        assert isinstance(other, TombstonableMixin)
                        other.is_tombstone = True
                elif duplicate_handling == DuplicateHandling.TOMBSTONE_AND_COPY:
                    for other in others:
                        assert isinstance(other, HistoryMixin)
                        other.is_tombstone = True
                    self.base_id = others[0].base_id
                elif duplicate_handling in (
                        DuplicateHandling.USE_ORIGINAL,
                        DuplicateHandling.ERROR):
                    other = others[0]
                    if inspect(self).pending:
                        other.db.expunge(self)
                    if duplicate_handling == DuplicateHandling.ERROR:
                        raise ObjectNotUniqueError(
                            "Duplicate of <%s> created" % (other.uri()))
                    # TODO: Check if there's a risk of infinite recursion here?
                    if json is None:
                        # TODO: Use the logic in api2.instance_put_form
                        raise NotImplementedError()
                    else:
                        # TODO: check the CrudPermissions on subobject,
                        # UNLESS it's they're inherited (eg Langstring)
                        return other._do_update_from_json(
                            json, parse_def, aliases, context, permissions,
                            user_id, duplicate_handling, jsonld)
                else:
                    raise ValueError("Invalid value of duplicate_handling")
        return self

    def unique_query(self):
        """returns a couple (query, usable), with a sqla query for conflicting similar objects.
        usable is true if the query has to be enforced; sometimes it makes sense to
        return un-usable query that will be used to construct queries of subclasses.
        Note that when a duplicate is found, you'll often want to expunge the original.
        """
        # To be reimplemented in subclasses with a more intelligent check.
        # See notification for example.
        return self.db.query(self.__class__), False

    def find_duplicate(self, expunge=True, must_define_uniqueness=False):
        """Verifies that no other object exists that would conflict.
        See unique_query for usable flag."""
        query, usable = self.unique_query()
        if must_define_uniqueness:
            assert usable, "Class %s needs a valid unique_query" % (
                self.__class__.__name__)
        if not usable:
            # This used to be True, meaning uniqueness test "succeeded".
            # But most invocations have a usable query, or force
            # must_define_uniqueness, so this case never actually arises,
            # and many downstream usage tests for None in a way that would.
            # fail with True. TODO: Cleanup must_define_uniqueness
            return None
        other = query.first()
        if other is not None and other is not self:
            if expunge and inspect(self).pending:
                other.db.expunge(self)
            return other

    def get_unique_from_db(self, expunge=True):
        """Returns the object, or a unique object from the DB"""
        return self.find_duplicate(expunge, True) or self

    def assert_unique(self):
        """Assert this object is unique"""
        duplicate = self.find_duplicate()
        if duplicate is not None:
            raise ObjectNotUniqueError("Duplicate of <%s> created" % (duplicate.uri()))

    @classmethod
    def extra_collections(cls):
        """Returns a dictionary of (named) collections of objects related to an instance of this class

        Many collections can be obtained by introspection on
        SQLAlchemy relationships, but collections here go beyond this."""
        return {}

    def is_owner(self, user_id):
        """The user owns this ressource, and has more permissions."""
        return False

    @classmethod
    def restrict_to_owners(cls, query, user_id):
        """filter query according to object owners"""
        return query

    """The permissions to create, read, update, delete an object of this class.
    Also separate permissions for the owners to update or delete."""
    crud_permissions = CrudPermissions()

    @classmethod
    def user_can_cls(cls, user_id, operation, permissions):
        """Whether the user, with the given permissions,
        can perform the given Crud operation on instances of this class."""
        perm = cls.crud_permissions.can(operation, permissions)
        user_id = user_id or Everyone
        if perm == IF_OWNED and user_id == Everyone:
            return False
        return perm

    def user_can(self, user_id, operation, permissions):
        """Whether the user, with the given permissions,
        can perform the given Crud operation on this instance."""
        user_id = user_id or Everyone
        perm = self.crud_permissions.can(operation, permissions)
        if perm != IF_OWNED:
            return perm
        if user_id == Everyone:
            return False
        return self.is_owner(user_id)


class Timestamped(BaseOps):
    """An automatically timestamped mixin. Not used."""
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


def make_session_maker(zope_tr=True, autoflush=True):
    return scoped_session(sessionmaker(
        autoflush=autoflush,
        extension=ZopeTransactionExtension() if zope_tr else None))


def initialize_session_maker(zope_tr=True, autoflush=True):
    "Initialize the application global sessionmaker object"
    global _session_maker
    assert _session_maker is None
    session_maker = make_session_maker(zope_tr, autoflush)
    if _session_maker is None:
        # The global object is the first one initialized
        _session_maker = session_maker
    return session_maker


def session_maker_is_initialized():
    global _session_maker
    return _session_maker is not None


def get_session_maker():
    "Get the application global sessionmaker object"
    global _session_maker
    assert _session_maker is not None
    return _session_maker


class PrivateObjectMixin(object):
    "marker class for objects that should be sent to owner"
    @abstractmethod
    def get_user_uri(self):
        return ""


class Tombstone(object):
    def __init__(self, ob, **kwargs):
        self.typename = ob.external_typename()
        self.uri = ob.uri()
        self.extra_args = kwargs
        if isinstance(ob, PrivateObjectMixin):
            self.extra_args['@private'] = ob.get_user_uri()

    def generic_json(self, *vargs, **kwargs):
        args = {"@type": self.typename,
                "@id": self.uri,
                "@tombstone": True}
        args.update(self.extra_args)
        return args

    def send_to_changes(self, connection, operation=CrudOperation.DELETE,
                        discussion_id=None, view_def="changes"):
        assert connection
        if 'cdict' not in connection.info:
            connection.info['cdict'] = {}
        connection.info['cdict'][(self.uri, view_def)] = (
            discussion_id, self)


def orm_update_listener(mapper, connection, target):
    if getattr(target, '__history_table__', None):
        return
    session = object_session(target)
    if session.is_modified(target, include_collections=False):
        # If the indexation fails, the postgres transaction is already committed, so there is no loss of data here.
        # If an object is modified several times during the transaction, only the last modification (including all previous changes) is kept. There is only a single request to elasticsearch at the end of the transaction.
        # We are using the elasticsearch bulk rest api here to index several documents with one request. It's just a PUT request and it returns immediately. The indexing in elasticsearch is then done asynchronously.
        # If by any bad luck, the elasticsearch is not responding, the postgres database and elasticsearch will be out of sync. We can always reindex completely the elasticsearch index which take 1 or 2 minutes to sync it again with the postgres database.
        reindex_content(target, 'update')
        target.send_to_changes(connection, CrudOperation.UPDATE)


def orm_insert_listener(mapper, connection, target):
    if getattr(target, '__history_table__', None):
        return
    reindex_content(target, 'insert')
    target.send_to_changes(connection, CrudOperation.CREATE)


def orm_delete_listener(mapper, connection, target):
    if 'cdict' not in connection.info:
        connection.info['cdict'] = {}
    if getattr(target, '__history_table__', None):
        return
    reindex_content(target, 'delete')
    target.tombstone().send_to_changes(connection, CrudOperation.DELETE)


def before_commit_listener(session):
    """Create the Json representation of changed objects which will be
    sent to the :py:mod:`assembl.tasks.changes_router`

    We have to do this before commit, while objects are still attached."""
    # If there hasn't been a flush yet, make sure any sql error occur BEFORE
    # we send changes to the socket.
    session.flush()
    info = session.connection().info
    if 'cdict' in info:
        changes = defaultdict(list)
        for ((uri, view_def), (discussion, target)) in \
                info['cdict'].iteritems():
            discussion = bytes(discussion or "*")
            json = target.generic_json(view_def)
            if json:
                changes[discussion].append(json)
        del info['cdict']
        session.cdict2 = changes
    else:
        print "EMPTY CDICT!"


def after_commit_listener(session):
    """After commit, actually send the Json representation of changed objects
    to the :py:mod:`assembl.tasks.changes_router`, through 0MQ."""
    if not getattr(session, 'zsocket', None):
        session.zsocket = get_pub_socket()
    if getattr(session, 'cdict2', None):
        for discussion, changes in session.cdict2.iteritems():
            send_changes(session.zsocket, discussion, changes)
        del session.cdict2


def session_rollback_listener(session):
    """In case of rollback, forget about object changes."""
    if getattr(session, 'cdict2', None):
        del session.cdict2


def engine_rollback_listener(connection):
    """In case of rollback, forget about object changes."""
    info = getattr(connection, 'info', None)
    if info and 'cdict' in info:
        del info['cdict']


event.listen(BaseOps, 'after_insert', orm_insert_listener, propagate=True)
event.listen(BaseOps, 'after_update', orm_update_listener, propagate=True)
event.listen(BaseOps, 'after_delete', orm_delete_listener, propagate=True)


def configure_engine(settings, zope_tr=True, autoflush=True, session_maker=None,
                     **engine_kwargs):
    """Return an SQLAlchemy engine configured as per the provided config."""
    if session_maker is None:
        if session_maker_is_initialized():
            print "ERROR: Initialized twice."
            session_maker = get_session_maker()
        else:
            session_maker = initialize_session_maker(zope_tr, autoflush)
    engine = session_maker.session_factory.kw['bind']
    if engine:
        return engine
    engine = engine_from_config(settings, 'sqlalchemy.', **engine_kwargs)
    session_maker.configure(bind=engine)
    global db_schema, _metadata, Base, TimestampedBase, ObsoleteBase, TimestampedObsolete
    if settings['sqlalchemy.url'].startswith('virtuoso:'):
        db_schema = '.'.join((settings['db_schema'], settings['db_user']))
    else:
        db_schema = settings['db_schema']
    _metadata = MetaData(schema=db_schema)
    Base, TimestampedBase = declarative_bases(_metadata, class_registry)
    obsolete = MetaData(schema=db_schema)
    ObsoleteBase, TimestampedObsolete = declarative_bases(obsolete)
    event.listen(Session, 'before_commit', before_commit_listener)
    event.listen(Session, 'after_commit', after_commit_listener)
    event.listen(Session, 'after_rollback', session_rollback_listener)
    event.listen(engine, 'rollback', engine_rollback_listener)
    return engine


def is_zopish():
    return isinstance(
        _session_maker.session_factory.kw.get('extension'),
        ZopeTransactionExtension)


def mark_changed(session=None):
    session = session or get_session_maker()()
    z_mark_changed(session)


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
def get_named_object(identifier, typename=None):
    "Get an object given a typename and identifier"
    if typename is None:
        typename = identifier.split(':')[-1].split('/')[-2]
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
