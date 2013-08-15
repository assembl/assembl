from sqlalchemy import types
from sqlalchemy.databases import postgresql
from sqlalchemy.schema import Column
from colander import SchemaType, null
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


class UUIDSchema(SchemaType):
    def __init__(self, encoding=None):
        self.encoding = encoding

    def serialize(self, node, appstruct):
        if appstruct in (null, None):
            return null

        try:
            if isinstance(appstruct, (text_type, bytes)):
                encoding = self.encoding
                if encoding:
                    result = text_(appstruct, encoding).encode(encoding)
                else:
                    result = text_type(appstruct)
            else:
                result = text_type(appstruct)
            return result
        except Exception as e:
            raise Invalid(node,
                          _('${val} cannot be serialized: ${err}',
                            mapping={'val':appstruct, 'err':e})
                          )
    def deserialize(self, node, cstruct):
        if not cstruct:
            return null

        try:
            result = cstruct
            if isinstance(result, (text_type, bytes)):
                if self.encoding:
                    result = text_(cstruct, self.encoding)
                else:
                    result = text_type(cstruct)
            else:
                result = text_type(cstruct)
        except Exception as e:
            raise Invalid(node,
                          _('${val} is not a string: ${err}',
                            mapping={'val':cstruct, 'err':e}))

        return result
