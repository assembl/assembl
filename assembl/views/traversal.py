from sqlalchemy.orm.attributes import InstrumentedAttribute
from pyramid.security import Allow, Everyone, ALL_PERMISSIONS, DENY_ALL

from assembl.lib.sqla import *


class AppRoot(object):
    def __init__(self):
        from assembl.auth import P_READ
        self.__acl__ = [(Allow, Everyone, P_READ)]
        self._api = ApiContext(self)

    __parent__ = None
    __name__ = "Assembl"

    def __getitem__(self, key):
        if key == 'data':
            return self._api
        if key == 'api':
            return self
        from assembl.models import Discussion
        discussion = Discussion.db.query(Discussion).filter_by(
            slug=key).first()
        if not discussion:
            raise KeyError()
        return discussion


class ApiContext(object):
    def __init__(self, parent):
        from ..auth.models import R_SYSADMIN
        self.__acl__ = [(Allow, R_SYSADMIN, ALL_PERMISSIONS), DENY_ALL]
        self.__parent__ = parent

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

    def create_object(self, type=None, json=None, **kwargs):
        if type is not None:
            cls = get_named_class(type)
        else:
            cls = self.collection.collection_class
        if json is None:
            return [cls(**kwargs)]
        else:
            return [cls.from_json(json)]


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
            relations = for_class.__mapper__.relationships
            collections = {
                rel.key: CollectionDefinition(for_class, rel)
                for rel in relations
            }
            extras = getattr(for_class, 'extra_collections', None)
            if extras:
                collections.update(extras())
            cls._collections_by_class[for_class] = collections
        return cls._collections_by_class[for_class]

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
        return parent.__acl__

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
        # if has a non-list relation of this class, add it
        relations = instance.__class__.__mapper__.relationships
        for reln in relations:
            if reln.uselist:
                continue
            if reln.mapper.class_ == self._instance.__class__:
                setattr(instance, reln.key, self._instance)
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
        instance = self.collection_class.get_instance(key)
        if not instance:
            raise KeyError()
        # Validate that the instance belongs to the collection...
        if not self.collection.contains(self.parent_instance, instance):
            raise KeyError("This instance does not live in this collection.")
        return InstanceContext(self, instance)

    def create_query(self, id_only=True):
        cls = self.collection.collection_class
        if id_only:
            query = cls.db().query(cls.id)
        else:
            query = cls.db().query(cls)
        return self.decorate_query(query)

    def decorate_query(self, query):
        # This will decorate a query with a join on the relation.
        query = self.collection.decorate_query(query, self.parent_instance)
        return self.__parent__.decorate_query(query)

    def decorate_instance(self, instance, assocs):
        self.__parent__.decorate_instance(instance, assocs)

    def create_object(self, type=None, json=None, **kwargs):
        if type is not None:
            cls = get_named_class(type)
        else:
            cls = self.collection.collection_class
        if json is None:
            inst = cls(**kwargs)
            assocs = [inst]
        else:
            assocs = cls.from_json(json)
            inst = assocs[0]
        # normally only the last link.
        self.collection.decorate_instance(inst, self.parent_instance, assocs)
        # But sometimes more
        self.__parent__.decorate_instance(inst, assocs)
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


class CollectionDefinition(object):
    back_property = None

    def __init__(self, owner_class, property):
        self.owner_class = owner_class
        self.property = property
        back_properties = list(property._reverse_property)
        if back_properties:
            # TODO: How to chose?
            self.back_property = back_properties.pop()
        self.collection_class = property.mapper.class_

    def decorate_query(self, query, parent_instance):
        # This will decorate a query with a join on the relation.
        cls = self.collection_class
        query = query.join(parent_instance.__class__)
        if self.back_property:
            inv = self.back_property
            # What we have is a property, not an instrumented attribute;
            # but they share the same key.
            back_attribute = getattr(cls, inv.key)
            query = query.filter(back_attribute == parent_instance)
        return query

    def decorate_instance(self, instance, parent_instance, assocs):
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
        attribute = self.get_attribute(parent_instance)
        if self.property.uselist:
            return instance in attribute
        else:
            return instance == attribute


def root_factory(request):
    return AppRoot()


def includeme(config):
    config.add_view_predicate('ctx_class', ClassContextPredicate)
    config.add_view_predicate('ctx_instance', InstanceContextPredicate)
    config.add_view_predicate('ctx_collection', CollectionContextPredicate)
    config.add_view_predicate('ctx_collection_class',
                              CollectionContextClassPredicate,
                              weighs_less_than='ctx_collection')
