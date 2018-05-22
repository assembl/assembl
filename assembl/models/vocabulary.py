from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
)
from sqlalchemy.orm import relationship, backref
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.dialects.postgresql import ENUM

from . import Base, DeclarativeAbstractMeta
from .langstrings import LangString
from ..lib.logging import getLogger


class UpdatablePgEnum(ENUM):
    """A Postgres-native enum type that will add values to the native enum
    when the Python Enum is updated."""
    def update_type(self, bind):
        "Update the postgres enum to match the values of the ENUM"
        value_names = self.enums
        db_names = [n for (n,) in bind.execute('select * from unnest(enum_range(null::%s))' % self.name)]
        if value_names != db_names:
            # Check no element was removed. If needed, introduce tombstones to enums.
            removed = set(db_names) - set(value_names)
            if removed:
                getLogger().warn("Some enum values were removed from type %s: %s" % (
                    self.name, ', '.join(removed)))
                db_names = [n for n in db_names if n not in removed]
            # Check no reordering.
            value_names_present = [n for n in value_names if n in db_names]
            assert db_names == value_names_present, "Do not reorder elements in an enum"
            # add missing values
            bind = bind.execution_options(isolation_level="AUTOCOMMIT")
            for i, name in enumerate(value_names):
                if i >= len(db_names) or name != db_names[i]:
                    if i == 0:
                        if len(db_names):
                            bind.execute(
                                "ALTER TYPE %s ADD VALUE '%s' BEFORE '%s'" % (
                                    self.name, name, db_names[0]))
                        else:
                            bind.execute(
                                "ALTER TYPE %s ADD VALUE '%s' " % (
                                    self.name, name))
                    else:
                        bind.execute(
                            "ALTER TYPE %s ADD VALUE '%s' AFTER '%s'" % (
                                self.name, name, db_names[i - 1]))
                        db_names[i:i] = name

    def create(self, bind=None, checkfirst=True):
        if bind.dialect.has_type(
                bind, self.name, schema=self.metadata.schema):
            self.update_type(bind)
        else:
            super(UpdatablePgEnum, self).create(bind, False)


class AbstractVocabulary(Base):
    __metaclass__ = DeclarativeAbstractMeta
    __abstract__ = True
    """A vocabulary backed by some identifier"""

    @declared_attr
    def name_id(cls):
        return Column("name_id", Integer, ForeignKey(LangString.id))

    @declared_attr
    def name(cls):
        return relationship(
            LangString,
            lazy="joined", single_parent=True,
            primaryjoin=cls.name_id == LangString.id,
            backref=backref("idvocabulary_from_name", lazy="dynamic"),
            cascade="all, delete-orphan")

    @classmethod
    def populate_db(cls, db=None):
        db = db or cls.default_db
        initial_names = getattr(cls, "_initial_names", None)
        if initial_names:
            values = db.query(cls).filter(cls.id.in_(cls.Enum.__members__.values())).all()
            values = {v.id: v for v in values}
            for id, names in initial_names.items():
                value = values.get(id, None)
                if value is None:
                    value = cls(id=id, name=LangString())
                    db.add(value)
                if value.name is None:
                    value.name = LangString()
                existing = {e.locale for e in value.name.entries}
                for locale, val in names.items():
                    if locale not in existing:
                        value.name.add_value(val, locale)


class AbstractIdentifierVocabulary(AbstractVocabulary):
    """A vocabulary backed by a string"""
    __abstract__ = True
    id = Column(String, primary_key=True)


class AbstractEnumVocabulary(AbstractVocabulary):
    """A vocabulary backed by a Python Enum.
    Define an 'Enum' member class (derived from enum.Enum)
    in concret subclasses.
    """
    __abstract__ = True

    @declared_attr
    def pg_enum_name(cls):
        return cls.__tablename__ + '_type'

    @declared_attr
    def pg_enum(cls):
        # TODO: reify
        return UpdatablePgEnum(
            cls.Enum, name=cls.pg_enum_name,
            metadata=cls.metadata, create_type=True)

    @declared_attr
    def id(cls):
        return Column(cls.pg_enum, primary_key=True)

    @declared_attr
    def name_id(cls):
        return Column("name_id", Integer, ForeignKey(LangString.id))

    @declared_attr
    def name(cls):
        return relationship(
            LangString,
            lazy="joined", single_parent=True,
            primaryjoin=cls.name_id == LangString.id,
            backref=backref("voc_%s_from_name" % (cls.__tablename__,),
                            lazy="dynamic"),
            cascade="all, delete-orphan")

    @classmethod
    def populate_db(cls, db=None):
        db = db or cls.default_db
        cls.pg_enum.create(db.bind)
        super(AbstractEnumVocabulary, cls).populate_db(db)

    def __repr__(self):
        return "<%s: %s>" % (self.__class__.__name__, self.id.name)
