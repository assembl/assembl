from datetime import datetime

from sqlalchemy import (
    Column, DateTime, Integer, UniqueConstraint, event, Table, ForeignKey)
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.sql.expression import join
from sqlalchemy.orm import relationship

from ..lib.sqla import (
    Base, TimestampedBase, get_metadata, get_session_maker,
    get_named_object, get_database_id, Tombstone, UPDATE_OP, DELETE_OP)
from ..semantic.virtuoso_mapping import QuadMapPatternS
from ..semantic.namespaces import ASSEMBL


class HistoryMixin(object):
    # Mixin class for objects with history

    @declared_attr
    def id_sequence_name(cls):
        return cls.__tablename__ + '_idsequence'

    @declared_attr
    def idtable_name(cls):
        return cls.__tablename__ + '_idtable'

    @declared_attr
    def __table_args__(cls):
        return (UniqueConstraint('base_id', 'tombstone_date'), )

    @declared_attr
    def identity_table(cls):
        return Table(cls.idtable_name,
            cls.metadata,
            Column('id', Integer, primary_key=True))

    id = Column(Integer, primary_key=True)

    # Note on tombstone_date: Virtuoso can test for its being null, but not non-null.
    tombstone_date = Column(DateTime, server_default=None)
    @declared_attr
    def base_id(cls):
        return Column(Integer,
            ForeignKey(cls.idtable_name + ".id"),
            nullable=False,
            info={'rdf': QuadMapPatternS(None, ASSEMBL.db_id)})

    @classmethod
    def identity_join(cls):
        return join(cls, cls.identity_table,
            (cls.identity_table.c.id == cls.base_id) & (cls.tombstone_date == None))

    @classmethod
    def identity_join_r(cls):
        return join(cls.identity_table, cls,
            (cls.identity_table.c.id == cls.base_id) & (cls.tombstone_date == None))

    @classmethod
    def atemporal_relationship(cls, **kwargs):
        return relationship(cls,
            secondary=cls.identity_join_r,
            uselist=False, viewonly=True, **kwargs)

    def _before_insert(self):
        (id,) = next(iter(self.db.execute(
            "select sequence_next('%s')" % self.id_sequence_name)))
        self.id = id
        if not self.base_id:
            self.db.execute(self.identity_table.insert().values(id=id))
            self.base_id = id

    @declared_attr
    def _before_insert_set_event(cls):
        @event.listens_for(cls, 'before_insert', propagate=True)
        def receive_before_insert(mapper, connection, target):
            target._before_insert()

    @property
    def original_uri(self):
        return self.uri_generic(self.base_id)

    @property
    def is_tombstone(self):
        return self.tombstone_date is not None

    @is_tombstone.setter
    def is_tombstone(self, value):
        # No necromancy
        if not value:
            assert self.tombstone_date is None
            return
        if self.tombstone_date is None:
            self.tombstone_date = datetime.utcnow()

    @classmethod
    def base_conditions(cls, alias=None, alias_maker=None):
        return (cls.tombstone_condition(alias),)

    @classmethod
    def tombstone_condition(cls, alias=None):
        cls = alias or cls
        return cls.tombstone_date == None

    @declared_attr
    def live(cls):
        return relationship(
            cls, secondary=cls.identity_table, uselist=False, viewonly=True,
            secondaryjoin=(cls.identity_table.c.id == cls.base_id) & (cls.tombstone_date==None))

    def copy(self, tombstone=None, **kwargs):
        """Clone object, optionally as tombstone
        reuse base_id. Redefine in subclasses to define arguments"""
        retval = self.__class__(
            base_id=self.base_id,
            tombstone_date=self.tombstone_date or (
                datetime.utcnow() if tombstone else None),
            **kwargs
        )
        self.db.add(retval)
        return retval
