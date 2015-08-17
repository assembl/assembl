from collections import Mapping, MutableMapping

import simplejson as json
from sqlalchemy import (
    Boolean,
    Column,
    String,
    Text,
    ForeignKey,
    Integer,
    Unicode,
    DateTime,
    desc,
    select,
    func,
    UniqueConstraint,
    event,
)
from sqlalchemy.orm import (relationship)
from sqlalchemy.ext.declarative import declared_attr

from ..lib.abc import abstractclassmethod
from . import DiscussionBoundBase
from assembl.lib import config
from auth import User
from discussion import Discussion


class AbstractNamespacedKeyValue(object):
    # No table name, these are simply common columns
    @declared_attr
    def id(self):
        return Column("id", Integer, primary_key=True)

    @declared_attr
    def namespace(self):
        return Column("namespace", String)#, index=True)

    @declared_attr
    def key(self):
        return Column("key", String)#, index=True)

    @declared_attr
    def value(self):
        return Column("value", Text)

    target_name = None
    target_id_name = None
    target_class = None

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
    # No table name, these are simply common columns
    @declared_attr
    def user_id(self):
        return Column("user_id", Integer, ForeignKey(User.id))

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


class UserNsDict(MutableMapping):
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


class DiscussionPerUserNamespacedKeyValue(
        DiscussionBoundBase, AbstractPerUserNamespacedKeyValue):
    __tablename__ = 'discussion_peruser_namespaced_key_value'

    discussion_id = Column(Integer, ForeignKey(Discussion.id))
    target_name = "discussion"
    target_id_name = "discussion_id"
    target_class = Discussion
    discussion = relationship(
        Discussion, backref="namespaced_peruser_key_values")
    user = relationship(
        User, backref="discussion_namespaced_key_values")

    def get_discussion_id(self):
        return self.discussion_id

    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return (cls.discussion_id == discussion_id, )

    def unique_query(self):
        query, _ = super(DiscussionNamespacedKeyValue, self).unique_query()
        query = query.filter(
            AbstractNamespacedKeyValue.user_id == self.user_id,
            AbstractNamespacedKeyValue.namespace == self.namespace,
            AbstractNamespacedKeyValue.key == self.key)
        return (query, True)

Discussion.per_user_namespaced_kv_class = DiscussionPerUserNamespacedKeyValue
