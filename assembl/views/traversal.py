from sqlalchemy import select
from sqlalchemy.orm.attributes import InstrumentedAttribute
from sqlalchemy.inspection import inspect as sqlainspect
from pyramid.security import Allow, Everyone, ALL_PERMISSIONS, DENY_ALL
from pyramid.httpexceptions import HTTPNotFound
from abc import ABCMeta, abstractmethod

from assembl.models.auth import P_READ, R_SYSADMIN
from assembl.lib.sqla import *


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
        discussion = Discussion.db.query(Discussion).filter_by(
            slug=key).first()
        if not discussion:
            raise KeyError()
        return discussion


class DiscussionsContext(object):
    def __getitem__(self, key):
        from assembl.models import Discussion
        discussion = Discussion.get(id=int(key))
        if not discussion:
            raise KeyError()
        return discussion


class Api2Context(object):
    def __init__(self, parent, acl):
        self.__parent__ = parent
        self.__acl__ = acl

    _class_cache = {}

    def __getitem__(self, key):
        cls = get_named_class(key)
        if not cls:
            raise KeyError()
        if cls not in self._class_cache:
            self._class_cache[cls] = ClassContext(self, cls)
        return self._class_cache[cls]


class ClassContext(object):
    def __init__(self, parent, cls):
        # permission on class context are quite restrictive. review.
        self.__acl__ = parent.__acl__
        self.__parent__ = parent
        self._class = cls

    def __getitem__(self, key):
        instance = self._class.get_instance(int(key))
        if not instance:
            raise KeyError()
        return InstanceContext(self, instance)

    def decorate_query(self, query):
        # The buck stops here
        return query

    def decorate_instance(self, instance, assocs):
        # and here
        pass

    def create_query(self, id_only=True):
        cls = self._class
        if id_only:
            return cls.db().query(cls.id)
        else:
            return cls.db().query(cls)

    def get_class(self, typename=None):
        if typename is not None:
            return get_named_class(typename)
        else:
            return self.collection.collection_class

    def create_object(self, typename=None, json=None, user_id=None, **kwargs):
        cls = self.get_class(typename)
        if json is None:
            cols = sqlainspect(cls).c
            kwargs = {k: int(v) if k in cols and
                      cols.get(k).type.python_type == int else v
                      for k, v in kwargs.iteritems()}
            return [cls(**kwargs)]
        else:
            return [cls.from_json(json, user_id)]


class ClassContextPredicate(object):
    def __init__(self, val, config):
        self.val = val

    def text(self):
        return 'class_context = %s' % (self.val,)

    phash = text

    def __call__(self, context, request):
        return isinstance(context, ClassContext) and context._class == self.val


class InstanceContext(object):
    def __init__(self, parent, instance):
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
                return Discussion.get(id=discussion_id).__acl__
        return self.__parent__.__acl__

    def __getitem__(self, key):
        cls = self._instance.__class__
        collection = self._get_collections(cls).get(key, None)
        if not collection:
            raise KeyError()
        return CollectionContext(self, collection, self._instance)

    def decorate_query(self, query):
        # Leave that work to the collection
        return self.__parent__.decorate_query(query)

    def decorate_instance(self, instance, assocs):
        # if one of the objects has a non-list relation to this class, add it
        # Slightly dangerous...
        for inst in assocs:
            relations = inst.__class__.__mapper__.relationships
            for reln in relations:
                if reln.uselist:
                    continue
                if getattr(inst, reln.key) is not None:
                    # This was already set, assume it was set correctly
                    continue
                if issubclass(self._instance.__class__, reln.mapper.class_):
                    setattr(inst, reln.key, self._instance)
                    break
        self.__parent__.decorate_instance(instance, assocs)


class InstanceContextPredicate(object):
    def __init__(self, val, config):
        self.val = val

    def text(self):
        return 'instance_context = %s' % (self.val,)

    phash = text

    def __call__(self, context, request):
        return isinstance(context, InstanceContext) and\
            isinstance(context._instance, self.val)


class CollectionContext(object):
    def __init__(self, parent, collection, instance):
        if isinstance(collection, InstrumentedAttribute):
            collection = collection.property
        # permission on class context are quite restrictive. review.
        self.__acl__ = parent.__acl__
        self.__parent__ = parent
        self.collection = collection
        self.parent_instance = instance
        self.collection_class = self.collection.collection_class

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

    def create_query(self, id_only=True):
        cls = self.collection.collection_class
        if id_only:
            query = cls.db().query(cls.id)
            return self.decorate_query(query).distinct()
        else:
            # There will be duplicates. But sqla takes care of them,
            # virtuoso won't allow distinct on full query,
            # and a distinct subquery takes forever.
            # Oh, and quietcast loses the distinct. Just great.
            query = cls.db().query(cls)
            return self.decorate_query(query)

    def decorate_query(self, query):
        # This will decorate a query with a join on the relation.
        query = self.collection.decorate_query(query, self.parent_instance)
        return self.__parent__.decorate_query(query)

    def decorate_instance(self, instance, assocs):
        self.collection.decorate_instance(
            instance, self.parent_instance, assocs)
        self.__parent__.decorate_instance(instance, assocs)

    def create_object(self, typename=None, json=None, user_id=None, **kwargs):
        cls = self.get_collection_class(typename)
        if json is None:
            cols = sqlainspect(cls).c
            kwargs = {k: int(v) if k in cols and
                      cols.get(k).type.python_type == int else v
                      for k, v in kwargs.iteritems()}
            inst = cls(**kwargs)
            assocs = [inst]
        else:
            assocs = cls.from_json(json, user_id)
            inst = assocs[0]
        self.decorate_instance(inst, assocs)
        return assocs


class CollectionContextPredicate(object):
    def __init__(self, val, config):
        self.val = val.property

    def text(self):
        return 'collection_context = %s' % (self.val,)

    phash = text

    def __call__(self, context, request):
        return isinstance(context, CollectionContext) and\
            self.val == context.collection


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

    def get_instance(self, key, parent_instance):
        instance = self.collection_class.get_instance(key)
        # Validate that the instance belongs to the collection...
        if instance and not self.contains(parent_instance, instance):
            raise KeyError("This instance does not live in this collection.")
        return instance

    @abstractmethod
    def decorate_query(self, query, parent_instance):
        pass

    @abstractmethod
    def decorate_instance(self, instance, parent_instance, assocs):
        pass

    @abstractmethod
    def contains(self, parent_instance, instance):
        pass


class CollectionDefinition(AbstractCollectionDefinition):
    back_property = None

    def __init__(self, owner_class, property):
        super(CollectionDefinition, self).__init__(
            owner_class, property.mapper.class_)
        self.property = property
        back_properties = list(property._reverse_property)
        if back_properties:
            # TODO: How to chose?
            self.back_property = back_properties.pop()

    def decorate_query(self, query, parent_instance):
        # This will decorate a query with a join on the relation.
        cls = self.collection_class
        query = query.join(parent_instance.__class__)
        if self.back_property:
            inv = self.back_property
            # What we have is a property, not an instrumented attribute;
            # but they share the same key.
            back_attribute = getattr(cls, inv.key)
            if inv.uselist:
                query = query.filter(back_attribute.contains(parent_instance))
            else:
                query = query.filter(back_attribute == parent_instance)
        return query

    def decorate_instance(self, instance, parent_instance, assocs):
        if not isinstance(instance, self.collection_class):
            return
        # if the relation is through a helper class,
        #   create that and add to assocs (TODO)
        # otherwise set the appropriate property (below.)
        if self.back_property:
            inv = self.back_property
            # What we have is a property, not an instrumented attribute;
            # but they share the same key.
            if inv.uselist:
                getattr(instance, inv.key).append(parent_instance)
            else:
                setattr(instance, inv.key, parent_instance)
        else:
            if self.property.uselist:
                getattr(parent_instance, self.property.key).append(instance)
            else:
                setattr(parent_instance, self.property.key, instance)

    def get_attribute(self, instance, property=None):
        # What we have is a property, not an instrumented attribute;
        # but they share the same key.
        property = property or self.property
        return getattr(instance, property.key)

    def contains(self, parent_instance, instance):
        if self.property.uselist:
            if self.back_property and not self.back_property.uselist:
                return self.get_attribute(
                    instance, self.back_property) == parent_instance
            return instance in self.get_attribute(parent_instance)
        else:
            return instance == self.get_attribute(parent_instance)

    def get_instance(self, key, parent_instance):
        instance = None
        if key == '-':
            if self.property.uselist:
                raise KeyError()
            else:
                instance = getattr(parent_instance, self.property.key, None)
        else:
            instance = self.collection_class.get_instance(key)
        # Validate that the instance belongs to the collection...
        if instance and not self.contains(parent_instance, instance):
            raise KeyError("This instance does not live in this collection.")
        return instance


def root_factory(request):
    # OK, this is the old code... I need to do better, but fix first.
    from ..models import Discussion
    if request.matchdict and 'discussion_id' in request.matchdict:
        discussion_id = int(request.matchdict['discussion_id'])
        discussion = Discussion.db.query(Discussion).get(discussion_id)
        if not discussion:
            raise HTTPNotFound("No discussion ID %d" % (discussion_id,))
        return discussion
    elif request.matchdict and 'discussion_slug' in request.matchdict:
        discussion_slug = request.matchdict['discussion_slug']
        discussion = Discussion.db.query(Discussion).filter_by(
            slug=discussion_slug).first()
        if not discussion:
            raise HTTPNotFound("No discussion named %s" % (discussion_slug,))
        return discussion
    return AppRoot()


def includeme(config):
    config.add_view_predicate('ctx_class', ClassContextPredicate)
    config.add_view_predicate('ctx_instance_class', InstanceContextPredicate)
    config.add_view_predicate('ctx_collection', CollectionContextPredicate)
    config.add_view_predicate('ctx_collection_class',
                              CollectionContextClassPredicate,
                              weighs_less_than='ctx_collection')
