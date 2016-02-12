from sqlalchemy.types import (
    TypeDecorator, String, PickleType, Text)
from sqlalchemy.ext.hybrid import Comparator
from sqlalchemy.sql import func
from werkzeug.urls import iri_to_uri
from pyisemail import is_email
from virtuoso.alchemy import CoerceUnicode
import simplejson as json


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


class EmailUnicode(CoerceUnicode, EmailString):

    def normalize_to_type(self, value, dialect):
        return CoerceUnicode.process_bind_param(self, value, dialect)

    def process_bind_param(self, value, dialect):
        # TODO: Handle RFC 6530
        return EmailString.process_bind_param(self, value, dialect)


class CaseInsensitiveWord(Comparator):
    "Hybrid value representing an upper case representation of a word."

    def __init__(self, word):
        if isinstance(word, basestring):
            self.word = word.upper()
        elif isinstance(word, CaseInsensitiveWord):
            self.word = word.word
        else:
            self.word = func.upper(word)

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
