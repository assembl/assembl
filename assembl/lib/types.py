from sqlalchemy import types
from sqlalchemy.databases import postgresql
from sqlalchemy.schema import Column
import uuid


class UUID(types.TypeDecorator):
    """
    Adapted from:
    http://stackoverflow.com/questions/183042/how-can-i-use-uuids-in-sqlalchemy
    """

    impl = postgresql.UUID

    def process_bind_param(self, value, dialect=None):
        if value and isinstance(value, uuid.UUID):
            return value.hex
        elif value and not isinstance(value, uuid.UUID):
            raise ValueError, 'value %s is not a valid uuid.UUID' % value
        else:
            return None

    def process_result_value(self, value, dialect=None):
        if value:
            return uuid.UUID(value.decode('utf8'))
        else:
            return None

    def is_mutable(self):
        return False
