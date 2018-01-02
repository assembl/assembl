"""Models for arbitrary key-values storage, bound to a namespace, a user, and some other object (currently only the discussion)."""
from collections import MutableMapping

import simplejson as json
from sqlalchemy import (
    Column,
    String,
    Text,
    ForeignKey,
    Integer,
    UniqueConstraint,
)
from sqlalchemy.orm import (relationship)
from sqlalchemy.ext.declarative import declared_attr
from pyramid.httpexceptions import HTTPUnauthorized

from . import DiscussionBoundBase
from assembl.lib import config
from auth import User
from ..auth.util import user_has_permission
from discussion import Discussion
from .preferences import Preferences
from .idea import Idea


class AbstractNamespacedKeyValue(object):
    """Mixin class for namespace-key-value triples in a namespaced dictionaries (dict of dict)"""
    # No table name, these are simply common columns
    @declared_attr
    def id(self):
        return Column("id", Integer, primary_key=True)

    @declared_attr
    def namespace(self):
        """The namespace of the key-value tuple"""
        return Column("namespace", String)

    @declared_attr
    def key(self):
        """The key of the key-value tuple"""
        return Column("key", String)

    @declared_attr
    def value(self):
        """The value of the key-value tuple"""
        return Column("value", Text)

    target_name = None
    target_id_name = None
    target_class = None

    @declared_attr
    def __table_args__(cls):
        schema, user = config.get('db_schema'), config.get('db_user')
        return (UniqueConstraint(
            getattr(cls, cls.target_id_name),
            cls.namespace,
            cls.key,
            name="%s_%s_%s_unique_constraint" % (
                schema, user, cls.__tablename__)),)

    @classmethod
    def add_nkv(cls, target, namespace, key, value):
        db = cls.default_db
        args = {
            "namespace": namespace,
            "key": key,
            cls.target_name: target
        }
        existing = db.query(cls).filter_by(**args).first()
        if existing:
            existing.value = json.dumps(value)
        cls.default_db.add(cls(value=json.dumps(value), **args))

    @classmethod
    def delete_nk(cls, target, namespace, key):
        db = cls.default_db
        args = {
            "namespace": namespace,
            "key": key,
            cls.target_name: target
        }
        existing = db.query(cls).filter_by(**args).first()
        if existing:
            existing.delete()

    @classmethod
    def clear_namespace(cls, target, namespace):
        db = cls.default_db
        args = {
            "namespace": namespace,
            cls.target_name: target
        }
        db.query(cls).filter_by(**args).delete()


class AbstractPerUserNamespacedKeyValue(
        AbstractNamespacedKeyValue):
    """Mixin class for user-namespace-key-value quads in a user-local namespaced dictionaries (dict of dict)"""
    # No table name, these are simply common columns
    @declared_attr
    def user_id(self):
        """The user of the key-value tuple"""
        return Column("user_id", Integer, ForeignKey(User.id), index=True)

    @declared_attr
    def __table_args__(cls):
        schema, user = config.get('db_schema'), config.get('db_user')
        return (UniqueConstraint(
            getattr(cls, cls.target_id_name),
            cls.namespace,
            cls.key,
            cls.user_id,
            name="%s_%s_%s_unique_constraint" % (
                schema, user, cls.__tablename__)),)

    @classmethod
    def add_nukv(cls, target, user, namespace, key, value):
        db = cls.default_db
        args = {
            "user": user,
            "namespace": namespace,
            "key": key,
            cls.target_name: target
        }
        existing = db.query(cls).filter_by(**args).first()
        if existing:
            existing.value = json.dumps(value)
        cls.default_db.add(cls(value=json.dumps(value), **args))

    @classmethod
    def delete_nuk(cls, target, user, namespace, key):
        db = cls.default_db
        args = {
            "user": user,
            "namespace": namespace,
            "key": key,
            cls.target_name: target
        }
        existing = db.query(cls).filter_by(**args).first()
        if existing:
            existing.delete()

    @classmethod
    def clear_namespace_for_user(cls, target, user, namespace):
        db = cls.default_db
        args = {
            "user": user,
            "namespace": namespace,
            cls.target_name: target
        }
        db.query(cls).filter_by(**args).delete()


class NamespacedUserKVCollection(MutableMapping):
    """View of the :py:class:`AbstractPerUserNamespacedKeyValue` for a given namespace as a python dict"""

    def __init__(self, target, user_id, namespace):
        self.target = target
        self.user_id = user_id
        self.namespace = namespace

    def __len__(self):
        ukv_cls = self.target.per_user_namespaced_kv_class
        return self.target.db.query(
            ukv_cls.key).filter_by(
                user_id=self.user_id,
                namespace=self.namespace,
                **{ukv_cls.target_name: self.target}).count()

    def __iter__(self):
        ukv_cls = self.target.per_user_namespaced_kv_class
        ns = self.target.db.query(
            ukv_cls.key).filter_by(
                user_id=self.user_id,
                namespace=self.namespace,
                **{ukv_cls.target_name: self.target})
        return (x for (x,) in ns)

    iterkeys = __iter__

    def iteritems(self):
        ukv_cls = self.target.per_user_namespaced_kv_class
        kvpairs = self.target.db.query(
            ukv_cls).filter_by(
                user_id=self.user_id,
                namespace=self.namespace,
                **{ukv_cls.target_name: self.target})
        return ((kvpair.key, json.loads(kvpair.value)) for kvpair in kvpairs)

    def __getitem__(self, key):
        ukv_cls = self.target.per_user_namespaced_kv_class
        value = self.target.db.query(
            ukv_cls.value).filter_by(
                user_id=self.user_id,
                namespace=self.namespace,
                key=key,
                **{ukv_cls.target_name: self.target}).first()
        if not value:
            raise IndexError()
        (value,) = value
        return json.loads(value)

    def __setitem__(self, key, value):
        ukv_cls = self.target.per_user_namespaced_kv_class
        kvpair = self.target.db.query(
            ukv_cls).filter_by(
                user_id=self.user_id,
                namespace=self.namespace,
                key=key,
                **{ukv_cls.target_name: self.target}).first()
        if kvpair:
            kvpair.value = json.dumps(value)
        else:
            self.target.db.add(ukv_cls(
                user_id=self.user_id,
                namespace=self.namespace,
                key=key,
                value=json.dumps(value),
                **{ukv_cls.target_name: self.target}))

    def __delitem__(self, key):
        ukv_cls = self.target.per_user_namespaced_kv_class
        kvpair = self.target.db.query(
            ukv_cls).filter_by(
                user_id=self.user_id,
                namespace=self.namespace,
                key=key,
                **{ukv_cls.target_name: self.target}).first()
        if not kvpair:
            raise IndexError()
        kvpair.delete()

    def __contains__(self, key):
        ukv_cls = self.target.per_user_namespaced_kv_class
        value = self.target.db.query(
            ukv_cls.id).filter_by(
                user_id=self.user_id,
                namespace=self.namespace,
                key=key,
                **{ukv_cls.target_name: self.target}).first()
        return value is not None


class NamespacedKVCollection(MutableMapping):
    """View of the :py:class:`AbstractNamespacedKeyValue` for a given namespace as a python dict"""

    def __init__(self, target, namespace):
        self.target = target
        self.namespace = namespace

    def __len__(self):
        kv_cls = self.target.namespaced_kv_class
        return self.target.db.query(
            kv_cls.key).filter_by(
                namespace=self.namespace,
                **{kv_cls.target_name: self.target}).count()

    def __iter__(self):
        kv_cls = self.target.namespaced_kv_class
        ns = self.target.db.query(
            kv_cls.key).filter_by(
                namespace=self.namespace,
                **{kv_cls.target_name: self.target})
        return (x for (x,) in ns)

    iterkeys = __iter__

    def iteritems(self):
        kv_cls = self.target.namespaced_kv_class
        kvpairs = self.target.db.query(
            kv_cls).filter_by(
                namespace=self.namespace,
                **{kv_cls.target_name: self.target})
        return ((kvpair.key, json.loads(kvpair.value)) for kvpair in kvpairs)

    def __getitem__(self, key):
        kv_cls = self.target.namespaced_kv_class
        value = self.target.db.query(
            kv_cls.value).filter_by(
                namespace=self.namespace,
                key=key,
                **{kv_cls.target_name: self.target}).first()
        if not value:
            raise IndexError()
        (value,) = value
        return json.loads(value)

    def __setitem__(self, key, value):
        kv_cls = self.target.namespaced_kv_class
        kvpair = self.target.db.query(
            kv_cls).filter_by(
                namespace=self.namespace,
                key=key,
                **{kv_cls.target_name: self.target}).first()
        if kvpair:
            kvpair.value = json.dumps(value)
        else:
            self.target.db.add(kv_cls(
                namespace=self.namespace,
                key=key,
                value=json.dumps(value),
                **{kv_cls.target_name: self.target}))

    def __delitem__(self, key):
        kv_cls = self.target.namespaced_kv_class
        kvpair = self.target.db.query(
            kv_cls).filter_by(
                namespace=self.namespace,
                key=key,
                **{kv_cls.target_name: self.target}).first()
        if not kvpair:
            raise IndexError()
        kvpair.delete()

    def __contains__(self, key):
        kv_cls = self.target.namespaced_kv_class
        value = self.target.db.query(
            kv_cls.id).filter_by(
                namespace=self.namespace,
                key=key,
                **{kv_cls.target_name: self.target}).first()
        return value is not None


class UserPreferenceCollection(NamespacedUserKVCollection):
    """The 'preferences' namespace has some specific behaviour.

    These are user preferences. See :py:mod:.preferences."""
    PREFERENCE_NAMESPACE = "preferences"
    ALLOW_OVERRIDE = "allow_user_override"

    def __init__(self, user_id, discussion=None):
        if discussion is None:
            self.dprefs = Preferences.get_by_name()
        else:
            self.dprefs = discussion.preferences
        super(UserPreferenceCollection, self).__init__(
            discussion, user_id, self.PREFERENCE_NAMESPACE)

    def __len__(self):
        return len(self.dprefs.property_defaults)

    def __setitem__(self, key, value):
        if key not in Preferences.preference_data_key_set:
            raise KeyError("Unknown property")
        pref_data = self.dprefs.get_preference_data()
        req_permission = pref_data.get(key, {}).get(
            self.ALLOW_OVERRIDE, False)
        if (not req_permission) or not user_has_permission(
                self.target.id if self.target else None,
                self.user_id, req_permission):
            raise HTTPUnauthorized("Cannot edit")
        self.dprefs.validate(key, value)
        super(UserPreferenceCollection, self).__setitem__(key, value)

    def safe_del(self, key, permissions=None):
        # always safe to go back to default
        del self[key]

    def safe_set(self, key, value, permissions=None):
        # safety built into __setitem__
        self[key] = value

    def __iter__(self):
        return self.dprefs.property_defaults.__iter__()

    iterkeys = __iter__

    def iteritems(self):
        keys = set()
        for k, v in super(UserPreferenceCollection, self).iteritems():
            keys.add(k)
            yield k, v
        for k, v in self.dprefs.items():
            if k not in keys:
                yield k, v

    def items(self):
        # the inherited items makes multiple requests
        return list(self.iteritems())

    def __getitem__(self, key):
        try:
            return super(UserPreferenceCollection, self).__getitem__(key)
        except IndexError:
            return self.dprefs[key]

    def __delitem__(self, key):
        try:
            return super(UserPreferenceCollection, self).__delitem__(key)
        except IndexError, e:
            if key not in self.dprefs:
                raise e

    def __contains__(self, key):
        return key in self.dprefs


class UserNsDict(MutableMapping):
    """The dictonary of :py:class:NamespacedUserKVCollection, indexed by namespace, as a python dict"""

    def __init__(self, target, user_id):
        self.target = target
        self.user_id = user_id

    def __len__(self):
        ukv_cls = self.target.per_user_namespaced_kv_class
        return self.target.db.query(
            ukv_cls.namespace).filter_by(
                user_id=self.user_id,
                **{ukv_cls.target_name: self.target}).distinct().count()

    def __iter__(self):
        ukv_cls = self.target.per_user_namespaced_kv_class
        ns = self.target.db.query(
            ukv_cls.namespace).filter_by(
                user_id=self.user_id,
                **{ukv_cls.target_name: self.target}).distinct()
        return (x for (x,) in ns)

    iterkeys = __iter__

    def iteritems(self):
        ukv_cls = self.target.per_user_namespaced_kv_class
        ns = self.target.db.query(
            ukv_cls.namespace).filter_by(
                user_id=self.user_id,
                **{ukv_cls.target_name: self.target}).distinct()
        return {x: NamespacedUserKVCollection(self.target, self.user_id, x)
                for (x,) in ns}

    def __getitem__(self, key):
        return NamespacedUserKVCollection(self.target, self.user_id, key)

    def __setitem__(self, key, value):
        raise NotImplementedError()

    def __delitem__(self, key):
        ukv_cls = self.target.per_user_namespaced_kv_class
        self.target.db.query(
            ukv_cls).filter_by(
                user_id=self.user_id,
                namespace=key,
                **{ukv_cls.target_name: self.target}).delete()


class NsDict(MutableMapping):
    """The dictonary of :py:class:NamespacedKVCollection, indexed by namespace, as a python dict"""

    def __init__(self, target):
        self.target = target

    def __len__(self):
        kv_cls = self.target.namespaced_kv_class
        return self.target.db.query(
            kv_cls.namespace).filter_by(
                **{kv_cls.target_name: self.target}).distinct().count()

    def __iter__(self):
        kv_cls = self.target.namespaced_kv_class
        ns = self.target.db.query(
            kv_cls.namespace).filter_by(
                **{kv_cls.target_name: self.target}).distinct()
        return (x for (x,) in ns)

    iterkeys = __iter__

    def iteritems(self):
        kv_cls = self.target.namespaced_kv_class
        ns = self.target.db.query(
            kv_cls.namespace).filter_by(
                **{kv_cls.target_name: self.target}).distinct()
        return {x: NamespacedKVCollection(self.target, x)
                for (x,) in ns}

    def __getitem__(self, key):
        return NamespacedKVCollection(self.target, key)

    def __setitem__(self, key, value):
        raise NotImplementedError()

    def __delitem__(self, key):
        kv_cls = self.target.namespaced_kv_class
        self.target.db.query(
            kv_cls).filter_by(
                namespace=key,
                **{kv_cls.target_name: self.target}).delete()


class DiscussionPerUserNamespacedKeyValue(
        DiscussionBoundBase, AbstractPerUserNamespacedKeyValue):
    """User-local namespaced dictionaries for a given discussion"""
    __tablename__ = 'discussion_peruser_namespaced_key_value'

    discussion_id = Column(Integer, ForeignKey(Discussion.id), index=True)
    target_name = "discussion"
    target_id_name = "discussion_id"
    target_class = Discussion
    discussion = relationship(
        Discussion, backref="namespaced_peruser_key_values")
    user = relationship(
        User, backref="discussion_namespaced_key_values")

    def get_discussion_id(self):
        return self.discussion_id

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return (cls.discussion_id == discussion_id, )

    def unique_query(self):
        query, _ = super(DiscussionPerUserNamespacedKeyValue, self
            ).unique_query()
        query = query.filter(
            AbstractNamespacedKeyValue.user_id == self.user_id,
            AbstractNamespacedKeyValue.namespace == self.namespace,
            AbstractNamespacedKeyValue.key == self.key)
        return (query, True)


Discussion.per_user_namespaced_kv_class = DiscussionPerUserNamespacedKeyValue


class IdeaNamespacedKeyValue(
        DiscussionBoundBase, AbstractNamespacedKeyValue):
    """Namespaced dictionaries for a given idea (not user-bound)"""
    __tablename__ = 'idea_namespaced_key_value'

    idea_id = Column(Integer, ForeignKey(Idea.id), index=True)
    target_name = "idea"
    target_id_name = "idea_id"
    target_class = Idea
    idea = relationship(
        Idea, backref="namespaced_key_values")

    def get_discussion_id(self):
        return self.idea.discussion_id

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        if alias_maker is None:
            idea_nskv = cls
            idea_cls = Idea
        else:
            idea_nskv = alias_maker.alias_from_class(cls)
            idea_cls = alias_maker.alias_from_relns(idea_nskv.source)
        return ((idea_nskv.idea_id == idea_cls.id),
                (idea_cls.discussion_id == discussion_id))

    def unique_query(self):
        query, _ = super(IdeaNamespacedKeyValue, self
            ).unique_query()
        query = query.filter(
            AbstractNamespacedKeyValue.namespace == self.namespace,
            AbstractNamespacedKeyValue.key == self.key)
        return (query, True)


Idea.namespaced_kv_class = IdeaNamespacedKeyValue
