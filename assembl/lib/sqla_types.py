"""Some specialized SQLAlchemy column types"""
from sqlalchemy.types import (
    TypeDecorator, String, PickleType, Text)
from sqlalchemy.ext.hybrid import Comparator
from sqlalchemy.sql import func
from werkzeug.urls import iri_to_uri
from pyisemail import is_email
# if using virtuoso
# from virtuoso.alchemy import CoerceUnicode
from sqlalchemy import Unicode as CoerceUnicode
from sqlalchemy.databases import postgresql
import simplejson as json
import uuid


class URLString(TypeDecorator):
    """Safely coerce URLs to Strings."""

    impl = String

    @property
    def python_type(self):
        return self.impl.python_type

    def process_bind_param(self, value, dialect):
        if not value:
            return value
        if isinstance(value, str):
            value = value.decode('utf-8')
        # TODO: Ensure NFC order.
        value = iri_to_uri(value)
        return value


class EmailString(TypeDecorator):
    impl = String

    @property
    def python_type(self):
        return self.impl.python_type

    @staticmethod
    def normalize_email_case(email):
        # Assumes valid email. ensure domain is lower case
        (name, domain) = email.split('@')
        return name+'@'+domain.lower()

    def normalize_to_type(self, value, dialect):
        if isinstance(value, unicode):
            return value.encode('ascii')
        return value

    def process_bind_param(self, value, dialect):
        if not value:
            return value
        value = self.normalize_to_type(value, dialect)
        if '%' in value:
            # LIKE search string
            return value
        if not is_email(value):
            raise ValueError(value+" is not a valid email")
        value = self.normalize_email_case(value)
        return value


# if using virtuoso
# class EmailUnicode(CoerceUnicode, EmailString):
#
#     def normalize_to_type(self, value, dialect):
#         return CoerceUnicode.process_bind_param(self, value, dialect)
#
#     def process_bind_param(self, value, dialect):
#         # TODO: Handle RFC 6530
#         return EmailString.process_bind_param(self, value, dialect)

class EmailUnicode(EmailString):
    impl = CoerceUnicode


class CaseInsensitiveWord(Comparator):
    "Hybrid value representing a lower case representation of a word."

    def __init__(self, word):
        if isinstance(word, basestring):
            self.word = word.lower()
        elif isinstance(word, CaseInsensitiveWord):
            self.word = word.word
        else:
            self.word = func.lower(word)

    def operate(self, op, other):
        if not isinstance(other, CaseInsensitiveWord):
            other = CaseInsensitiveWord(other)
        return op(self.word, other.word)

    def __clause_element__(self):
        return self.word

    def __str__(self):
        return self.word

    key = 'word'
    "Label to apply to Query tuple results"


# JSON type field
class JSONType(PickleType):
    impl = Text

    def __init__(self, *args, **kwargs):
        kwargs['pickler'] = json
        super(JSONType, self).__init__(*args, **kwargs)


class UUID(TypeDecorator):
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
