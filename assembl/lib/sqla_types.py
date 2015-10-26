from sqlalchemy.types import TypeDecorator, String
from werkzeug.urls import iri_to_uri


class URLString(TypeDecorator):
    """Safely coerce URLs to Strings."""

    impl = String

    def process_bind_param(self, value, dialect):
        if not value:
            return value
        if isinstance(value, str):
            value = value.decode('utf-8')
        # TODO: Ensure NFC order.
        value = iri_to_uri(value)
        return value
