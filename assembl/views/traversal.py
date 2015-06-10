from traceback import print_exc

from sqlalchemy import select
from sqlalchemy.orm import aliased
from sqlalchemy.orm.attributes import InstrumentedAttribute
from sqlalchemy.sql.expression import and_
from sqlalchemy.inspection import inspect as sqlainspect
from pyramid.security import Allow, Everyone, ALL_PERMISSIONS, DENY_ALL
from pyramid.settings import asbool
from pyramid.httpexceptions import HTTPNotFound
from abc import ABCMeta, abstractmethod

from assembl.auth import P_READ, R_SYSADMIN
from assembl.lib.sqla import *
from assembl.lib.decl_enums import DeclEnumType


class DictContext(object):
    def __init__(self, acl, subobjects=None):
        self.subobjects = subobjects or {}
        for context in self.subobjects.itervalues():
            context.__parent__ = self
        if acl:
            self.__acl__ = acl

    def __getitem__(self, key):
        return self.subobjects[key]


class AppRoot(DictContext):
    def __init__(self):
        readable = [(Allow, R_SYSADMIN, ALL_PERMISSIONS),
                    (Allow, Everyone, P_READ), DENY_ALL]
        restrictive = [(Allow, R_SYSADMIN, ALL_PERMISSIONS), DENY_ALL]
        super(AppRoot, self).__init__(readable, {
            'data': Api2Context(self, restrictive),
            'admin': DictContext(restrictive, {
                'permissions': DictContext(None, {
                    'discussion': DiscussionsContext()})}),
            'api': DictContext(restrictive, {
                'v1': DictContext(None, {
                    'discussion': DiscussionsContext(),
                    'token': DictContext(readable)})})})

    __parent__ = None
    __name__ = "Assembl"

    def __getitem__(self, key):
        if key in self.subobjects:
            return self.subobjects[key]
        from assembl.models import Discussion
        discussion = Discussion.default_db.query(Discussion).filter_by(
            slug=key).first()
        if not discussion:
            raise KeyError()
        return discussion


class DiscussionsContext(object):
    def __getitem__(self, key):
        from assembl.models import Discussion
        discussion = Discussion.get(int(key))
        if not discussion:
            raise KeyError()
        return discussion


class TraversalContext(object):

    def __init__(self, parent, acl=None):
        self.__parent__ = parent
        self.__acl__ = acl or parent.__acl__

    def find_collection(self, collection_class_name):
        return None

    def get_discussion_id(self):
        return None

    def get_instance_of_class(self, cls):
        return None

    def decorate_query(self, query, last_alias, ctx, tombstones=False):
        # The buck stops here
        return query

    def decorate_instance(self, instance, assocs, user_id, ctx, kwargs):
        # and here
        pass

    def get_target_class(self):
        return None


class Api2Context(TraversalContext):
    _class_cache = {}

    def __init__(self, parent, acl=None):
        super(Api2Context, self).__init__(parent, acl)

    def get_default_view(self):
        pass

    def __getitem__(self, key):
        cls = get_named_class(key)
        if not cls:
            raise KeyError()
        if cls not in self._class_cache:
            self._class_cache[cls] = ClassContext(self, cls)
        return self._class_cache[cls]

    def all_class_names(self):
        return [k for k in Base._decl_class_registry.iterkeys() if k[0] != '_']


def process_args(args, cls):
    mapper = sqlainspect(cls)
    for key, value in args.iteritems():
        column = mapper.c.get(key)
        if column is not None:
            if isinstance(column.type, DeclEnumType):
                yield (key, column.type.enum.from_string(value))
            elif column.type.python_type == int:
                yield (key, int(value))
            elif column.type.python_type == float:
                yield (key, float(value))
            elif column.type.python_type == bool:
                yield (key, asbool(value))
            else:
                yield (key, value)
            continue
        reln = mapper.relationships.get(key)
        if (reln is not None and reln.direction.name == 'MANYTOONE'
                and isinstance(value, (str, unicode))):
            assert(len(reln.local_columns) == 1)
            key = next(reln.local_columns.__iter__()).key
            yield (key, reln.mapper.class_.get_database_id(value))
            continue
        if isinstance(getattr(cls, key, None), property):
            yield (key, value)
            continue


class ClassContext(TraversalContext):
    def __init__(self, parent, cls):
        # permission on class context are quite restrictive. review.
        super(ClassContext, self).__init__(parent)
        self._class = cls

    def __getitem__(self, key):
        try:
            instance = self._class.get_instance(int(key))
        except ValueError:
            raise KeyError()
        if not instance:
            raise KeyError()
        return InstanceContext(self, instance)

    def get_default_view(self):
        my_default = getattr(self._class, 'default_view', None)
        if my_default:
            return my_default
        return self.__parent__.get_default_view()

    def create_query(self, id_only=True, tombstones=False):
        from assembl.models import HistoryMixin
        cls = self._class
        self.class_alias = alias = aliased(cls)
        if id_only:
            query = self._class.default_db.query(alias.id)
        else:
            query = self._class.default_db.query(alias)
        # TODO: Distinguish tombstone condition from other base_conditions
        if issubclass(cls, HistoryMixin) and not tombstones:
            query = query.filter(and_(*cls.base_conditions(alias)))
        return query

    def get_class(self, typename=None):
        if typename is not None:
            return get_named_class(typename)
        else:
            return self.collection.collection_class

    def get_target_class(self):
        return self._class

    def create_object(self, typename=None, json=None, user_id=None, **kwargs):
        cls = self.get_class(typename)
        with self._class.default_db.no_autoflush:
            if json is None:
                mapper = sqlainspect(cls)
                for prop in ('creator_id', 'user_id'):
                    if prop in mapper.c and prop not in kwargs:
                        kwargs[prop] = user_id
                        break
                try:
                    return [cls(**dict(process_args(kwargs, cls)))]
                except Exception as e:
                    print_exc()
                    raise e
            else:
                return [cls.create_from_json(json, user_id, self)]


class ClassContextPredicate(object):
    def __init__(self, val, config):
        self.val = val

    def text(self):
        return 'class_context = %s' % (self.val,)

    phash = text

    def __call__(self, context, request):
        return isinstance(context, ClassContext) and context._class == self.val


class InstanceContext(TraversalContext):
    def __init__(self, parent, instance):
        # Do not call super, because it will set the acl.
        self._instance = instance
        self.__parent__ = parent
        #relations = instance.__class__.__mapper__.relationships

    _collections_by_class = {}

    @classmethod
    def _get_collections(cls, for_class):
        if for_class not in cls._collections_by_class:
            collections = dict(for_class.extra_collections())
            relations = for_class.__mapper__.relationships
            for rel in relations:
                if rel.key not in collections:
                    collections[rel.key] = CollectionDefinition(for_class, rel)
            cls._collections_by_class[for_class] = collections
        return cls._collections_by_class[for_class]

    def get_collection_names(self):
        return self.__class__._get_collections(
            self._instance.__class__).keys()

    def get_default_view(self):
        my_default = getattr(self._instance, 'default_view', None)
        if my_default:
            return my_default
        return self.__parent__.get_default_view()

    @property
    def __acl__(self):
        if getattr(self._instance, '__acl__', None):
            return self._instance.__acl__
        if getattr(self._instance, 'discussion', None):
            return self._instance.discussion.__acl__
        if getattr(self._instance, 'get_discussion_id', None):
            discussion_id = self._instance.get_discussion_id()
            if discussion_id:
                from assembl.models import Discussion
                return Discussion.get(discussion_id).__acl__
        return self.__parent__.__acl__

    def __getitem__(self, key):
        cls = self._instance.__class__
        collection = self._get_collections(cls).get(key, None)
        if not collection:
            raise KeyError()
        return CollectionContext(self, collection, self._instance)

    def decorate_query(self, query, last_alias, ctx, tombstones=False):
        # Leave that work to the collection
        return self.__parent__.decorate_query(
            query, last_alias, ctx, tombstones)

    def decorate_instance(self, instance, assocs, user_id, ctx, kwargs):
        # if one of the objects has a non-list relation to this class, add it
        # Slightly dangerous...
        for inst in assocs:
            relations = inst.__class__.__mapper__.relationships
            for reln in relations:
                if uses_list(reln):
                    continue
                if getattr(inst, reln.key, None) is not None:
                    # This was already set, assume it was set correctly
                    continue
                if issubclass(self._instance.__class__, reln.mapper.class_):
                    #print "Setting3 ", inst, reln.key, self._instance
                    setattr(inst, reln.key, self._instance)
                    break
        self.__parent__.decorate_instance(instance, assocs, user_id, ctx, kwargs)

    def find_collection(self, collection_class_name):
        return self.__parent__.find_collection(collection_class_name)

    def get_discussion_id(self):
        from assembl.models import DiscussionBoundBase
        if isinstance(self._instance, DiscussionBoundBase):
            return self._instance.get_discussion_id()
        return self.__parent__.get_discussion_id()

    def get_instance_of_class(self, cls):
        if isinstance(self._instance, cls):
            return self._instance
        return self.__parent__.get_instance_of_class(cls)

    def get_target_class(self):
        return self._instance.__class__


class InstanceContextPredicate(object):
    def __init__(self, val, config):
        self.val = val

    def text(self):
        return 'instance_context = %s' % (self.val,)

    phash = text

    def __call__(self, context, request):
        return isinstance(context, InstanceContext) and\
            isinstance(context._instance, self.val)


class InstanceContextPredicateWithExceptions(object):
    def __init__(self, val, config):
        cls, cls_exceptions = val
        self.val = cls
        self.cls_exceptions = cls_exceptions

    def text(self):
        return 'instance_context = %s except %s' % (
            self.val, repr(self.cls_exceptions))

    phash = text

    def __call__(self, context, request):
        return isinstance(context, InstanceContext) and\
            isinstance(context._instance, self.val) and\
            not isinstance(context._instance, self.cls_exceptions)


class CollectionContext(TraversalContext):
    def __init__(self, parent, collection, instance):
        super(CollectionContext, self).__init__(parent)
        if isinstance(collection, InstrumentedAttribute):
            collection = collection.property
        # permission on class context are quite restrictive. review.
        self.collection = collection
        self.parent_instance = instance
        self.collection_class = self.collection.collection_class

    def get_default_view(self):
        my_default = self.collection.get_default_view()
        if my_default:
            return my_default
        return self.__parent__.get_default_view()

    def __getitem__(self, key):
        instance = self.collection.get_instance(key, self.parent_instance)
        if not instance:
            raise KeyError()
        return InstanceContext(self, instance)

    def get_collection_class(self, typename=None):
        if typename is not None:
            return get_named_class(typename)
        else:
            return self.collection_class

    def get_target_class(self):
        return self.collection_class

    def create_query(self, id_only=True, tombstones=False):
        cls = self.collection_class
        alias = aliased(cls)
        if id_only:
            query = self.parent_instance.db.query(alias.id)
            return self.decorate_query(
                query, alias, self, tombstones).distinct()
        else:
            # There will be duplicates. But sqla takes care of them,
            # virtuoso won't allow distinct on full query,
            # and a distinct subquery takes forever.
            # Oh, and quietcast loses the distinct. Just great.
            query = self.parent_instance.db.query(alias)
            return self.decorate_query(query, alias, self, tombstones)

    def decorate_query(self, query, last_alias, ctx, tombstones=False):
        # This will decorate a query with a join on the relation.
        from assembl.models import HistoryMixin
        self.collection_class_alias = last_alias
        query = self.collection.decorate_query(
            query, last_alias, self.parent_instance, ctx)
        cls = self.collection_class
        if issubclass(cls, HistoryMixin) and not tombstones:
            query = query.filter(cls.tombstone_condition(last_alias))
        return self.__parent__.decorate_query(
            query, self.collection.owner_alias, ctx, tombstones)

    def decorate_instance(self, instance, assocs, user_id, ctx, kwargs):
        self.collection.decorate_instance(
            instance, self.parent_instance, assocs, user_id, ctx, kwargs)
        self.__parent__.decorate_instance(instance, assocs, user_id, ctx, kwargs)

    def create_object(self, typename=None, json=None, user_id=None, **kwargs):
        cls = self.get_collection_class(typename)
        with self.parent_instance.db.no_autoflush:
            try:
                if json is None:
                    mapper = sqlainspect(cls)
                    for prop in ('creator_id', 'user_id'):
                        if prop in mapper.c and prop not in kwargs:
                            kwargs[prop] = user_id
                            break
                    inst = cls(**dict(process_args(kwargs, cls)))
                else:
                    inst = cls.create_from_json(json, user_id, self)
            except Exception as e:
                print_exc()
                raise e
            assocs = [inst]
            self.decorate_instance(inst, assocs, user_id, self, kwargs)
        return assocs

    def __repr__(self):
        return "<CollectionContext (%s)>" % (
            self.collection,)

    def find_collection(self, collection_class_name):
        if self.collection.name() == collection_class_name:
            return self
        return self.__parent__.find_collection(collection_class_name)

    def get_discussion_id(self):
        return self.__parent__.get_discussion_id()

    def get_instance_of_class(self, cls):
        return self.__parent__.get_instance_of_class(cls)


class NamedCollectionContextPredicate(object):
    def __init__(self, val, config):
        self.val = val

    def text(self):
        return 'collection_context_name = %s' % (self.val,)

    phash = text

    def __call__(self, context, request):
        return (isinstance(context, CollectionContext)
                and self.val == context.collection.name())


class NamedCollectionInstancePredicate(object):
    def __init__(self, val, config):
        self.val = val

    def text(self):
        return 'collection_instance_context_name = %s' % (self.val,)

    phash = text

    def __call__(self, context, request):
        parent = context.__parent__
        return (isinstance(context, InstanceContext)
            and isinstance(parent, CollectionContext)
            and self.val == parent.collection.name())


class SecureConnectionPredicate(object):
    def __init__(self, val, config):
        self.val = bool(val)

    def text(self):
        return 'secure_connection'

    phash = text

    def __call__(self, context, request):
        return self.val == (
            request.environ['wsgi.url_scheme'] == 'https')


class CollectionContextClassPredicate(object):
    def __init__(self, val, config):
        self.val = val

    def text(self):
        return 'collection_context_class = %s' % (self.val,)

    phash = text

    def __call__(self, context, request):
        return isinstance(context, CollectionContext) and\
            issubclass(context.collection_class, self.val)


class AbstractCollectionDefinition(object):
    __metaclass__ = ABCMeta

    def __init__(self, owner_class, collection_class):
        self.owner_class = owner_class
        self.collection_class = collection_class
        self.owner_alias = aliased(owner_class)

    def get_instance(self, key, parent_instance):
        instance = self.collection_class.get_instance(key)
        # Validate that the instance belongs to the collection...
        if instance and not self.contains(parent_instance, instance):
            raise KeyError("This instance does not live in this collection.")
        return instance

    @abstractmethod
    def decorate_query(self, query, last_alias, parent_instance, ctx):
        pass

    @abstractmethod
    def decorate_instance(
            self, instance, parent_instance, assocs, user_id, ctx, kwargs):
        pass

    @abstractmethod
    def contains(self, parent_instance, instance):
        pass

    def get_default_view(self):
        pass

    def name(self):
        return self.__class__.__name__

    @staticmethod
    def filter_kwargs(cls, kwargs):
        prefix = cls.__name__ + '__'
        return {k[len(prefix):]: v
                for k, v in kwargs.iteritems()
                if k.startswith(prefix)}

    def __repr__(self):
        return "<%s %s -> %s>" % (
            self.__class__.__name__,
            self.owner_class.__name__,
            self.collection_class.__name__)

def uses_list(prop):
    # Weird indirection
    uselist = getattr(prop, 'uselist', None)
    if uselist is not None:
        return uselist
    subprop = getattr(prop, 'property', None)
    if subprop:
        return subprop.uselist


class CollectionDefinition(AbstractCollectionDefinition):
    back_property = None

    def __init__(self, owner_class, property):
        super(CollectionDefinition, self).__init__(
            owner_class, property.mapper.class_)
        self.property = property
        back_properties = list(getattr(property, '_reverse_property', ()))
        if back_properties:
            # TODO: How to chose?
            self.back_property = back_properties.pop()

    def decorate_query(self, query, last_alias, parent_instance, ctx):
        # This will decorate a query with a join on the relation.
        coll_alias = last_alias or aliased(self.collection_class)
        owner_alias = self.owner_alias
        inv = self.back_property
        if inv:
            query = query.join(owner_alias,
                getattr(coll_alias, inv.key))
        else:
            query = query.join(last_alias,
                getattr(owner_alias, self.property.key))
        if inv and not uses_list(inv):
            query = query.filter(getattr(coll_alias, inv.key) == parent_instance)
        else:
            query = query.filter(owner_alias.id == parent_instance.id)
        return query

    def decorate_instance(self, instance, parent_instance, assocs, user_id, ctx, kwargs):
        if not isinstance(instance, self.collection_class):
            return
        # if the relation is through a helper class,
        #   create that and add to assocs (TODO)
        # otherwise set the appropriate property (below.)
        # Prefer non-list properties because we can check if they're set.
        if not uses_list(self.property):
            if getattr(parent_instance, self.property.key, None) is None:
                #print "Setting1 ", parent_instance, self.property.key, instance
                setattr(parent_instance, self.property.key, instance)
        elif self.back_property and not uses_list(self.back_property):
            inv = self.back_property
            if getattr(instance, inv.key, None) is None:
                #print "Setting2 ", instance, inv.key, parent_instance
                setattr(instance, inv.key, parent_instance)
        elif self.back_property:
            inv = self.back_property
            #print "Adding1 ", instance, inv.key, parent_instance
            getattr(instance, inv.key).append(parent_instance)
        else:
            #print "Adding2 ", parent_instance, self.property.key, instance
            getattr(parent_instance, self.property.key).append(instance)

    def get_attribute(self, instance, property=None):
        # What we have is a property, not an instrumented attribute;
        # but they share the same key.
        property = property or self.property
        return getattr(instance, property.key)

    def contains(self, parent_instance, instance):
        if uses_list(self.property):
            if self.back_property and not uses_list(self.back_property):
                return self.get_attribute(
                    instance, self.back_property) == parent_instance
            return instance in self.get_attribute(parent_instance)
        else:
            return instance == self.get_attribute(parent_instance)

    def get_instance(self, key, parent_instance):
        instance = None
        if key == '-':
            if not uses_list(self.property):
                instance = getattr(parent_instance, self.property.key, None)
            else:
                # Allow if it happens to be a singleton.
                instances = getattr(parent_instance, self.property.key)
                if len(instances) == 1:
                    return instances[0]
                raise KeyError()
        else:
            instance = self.collection_class.get_instance(key)
        # Validate that the instance belongs to the collection...
        if instance and not self.contains(parent_instance, instance):
            raise KeyError("This instance does not live in this collection.")
        return instance

    def name(self):
        cls = self.owner_class if (
            self.__class__ == CollectionDefinition) else self.__class__
        return ".".join((cls.__name__, self.property.key))

    def __repr__(self):
        return "<%s %s -(%s/%s)-> %s>" % (
            self.__class__.__name__,
            self.owner_class.__name__,
            self.property.key,
            self.back_property.key if self.back_property else '',
            self.collection_class.__name__)

def root_factory(request):
    # OK, this is the old code... I need to do better, but fix first.
    from ..models import Discussion
    if request.matchdict and 'discussion_id' in request.matchdict:
        discussion_id = int(request.matchdict['discussion_id'])
        discussion = Discussion.default_db.query(Discussion).get(discussion_id)
        if not discussion:
            raise HTTPNotFound("No discussion ID %d" % (discussion_id,))
        return discussion
    elif request.matchdict and 'discussion_slug' in request.matchdict:
        discussion_slug = request.matchdict['discussion_slug']
        discussion = Discussion.default_db.query(Discussion).filter_by(
            slug=discussion_slug).first()
        if not discussion:
            raise HTTPNotFound("No discussion named %s" % (discussion_slug,))
        return discussion
    return AppRoot()


def includeme(config):
    config.add_view_predicate('ctx_class', ClassContextPredicate)
    config.add_view_predicate('ctx_instance_class', InstanceContextPredicate)
    config.add_view_predicate('ctx_instance_class_with_exceptions',
        InstanceContextPredicateWithExceptions)
    config.add_view_predicate('ctx_named_collection',
        NamedCollectionContextPredicate)
    config.add_view_predicate('ctx_named_collection_instance',
        NamedCollectionInstancePredicate)
    config.add_view_predicate('secure_connection', SecureConnectionPredicate)
    config.add_view_predicate('ctx_collection_class',
                              CollectionContextClassPredicate,
                              weighs_less_than='ctx_named_collection')
