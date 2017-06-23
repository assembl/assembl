"""Enumerations that can be stored in the database.

Mostly from http://techspot.zzzeek.org/2011/01/14/the-enum-recipe/ """
from sqlalchemy.types import SchemaType, TypeDecorator, Enum
from sqlalchemy import __version__
import re

if __version__ < '0.6.5':
    raise NotImplementedError("Version 0.6.5 or higher of SQLAlchemy is required.")

class EnumSymbol(object):
    """Define a fixed symbol tied to a parent class."""

    def __init__(self, cls_, name, value, description):
        self.cls_ = cls_
        self.name = name
        self.value = value
        self.description = description

    def __reduce__(self):
        """Allow unpickling to return the symbol
        linked to the DeclEnum class."""
        return getattr, (self.cls_, self.name)

    def __iter__(self):
        return iter([self.value, self.description])

    def __repr__(self):
        return "<%s>" % self.name

class EnumMeta(type):
    """Generate new DeclEnum classes."""

    def __init__(cls, classname, bases, dict_):
        cls._reg = reg = cls._reg.copy()
        for k, v in dict_.items():
            if isinstance(v, tuple):
                sym = reg[v[0]] = EnumSymbol(cls, k, *v)
                setattr(cls, k, sym)
        super(EnumMeta, cls).__init__(classname, bases, dict_)

    def __iter__(self):
        return iter(self._reg.values())

class DeclEnum(object):
    """Declarative enumeration."""

    __metaclass__ = EnumMeta
    _reg = {}

    @classmethod
    def from_string(cls, value):
        try:
            return cls._reg[value]
        except KeyError:
            raise ValueError(
                    "Invalid value for %r: %r" %
                    (cls.__name__, value)
                )

    @classmethod
    def values(cls):
        return cls._reg.keys()

    @classmethod
    def db_type(cls):
        return DeclEnumType(cls)


class DeclEnumType(SchemaType, TypeDecorator):
    def __init__(self, enum, **kwargs):
        super(DeclEnumType, self).__init__(**kwargs)
        self.enum = enum
        self.impl = Enum(
                        *enum.values(),
                        name="ck%s" % re.sub(
                                    '([A-Z])',
                                    lambda m:"_" + m.group(1).lower(),
                                    enum.__name__)
                    )

    def _set_table(self, column, table):
        self.impl.name = "ck_%s_%s_%s" % (
            '_'.join(table.schema.split('.')), table.name, self.impl.name[3:])
        self.impl._set_table(column, table)

    def copy(self, **kw):
        return DeclEnumType(self.enum, **kw)

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, EnumSymbol):
            return value.value
        elif isinstance(value, (str, unicode)):
            # Should not happen, but mask the error for now.
            return value

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return self.enum.from_string(value.strip())

if __name__ == '__main__':
    from sqlalchemy.ext.declarative import declarative_base
    from sqlalchemy import Column, Integer, String, create_engine
    from sqlalchemy.orm import Session

    Base = declarative_base()

    class EmployeeType(DeclEnum):
        part_time = "P", "Part Time"
        full_time = "F", "Full Time"
        contractor = "C", "Contractor"

    class Employee(Base):
        __tablename__ = 'employee'

        id = Column(Integer, primary_key=True)
        name = Column(String(60), nullable=False)
        type = Column(EmployeeType.db_type())

        def __repr__(self):
            return "Employee(%r, %r)" % (self.name, self.type)

    e = create_engine('sqlite://', echo=True)
    Base.metadata.create_all(e)

    sess = Session(e)

    sess.add_all([
        Employee(name='e1', type=EmployeeType.full_time),
        Employee(name='e2', type=EmployeeType.full_time),
        Employee(name='e3', type=EmployeeType.part_time),
        Employee(name='e4', type=EmployeeType.contractor),
        Employee(name='e5', type=EmployeeType.contractor),
    ])
    sess.commit()

    print sess.query(Employee).filter_by(type=EmployeeType.contractor).all()
