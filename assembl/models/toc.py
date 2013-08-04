from . import TimestampedObsolete

from sqlalchemy import (ForeignKey, Integer, String, Unicode, UnicodeText,
                        event, Column)
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.orm import backref, mapper, relationship



class Document(TimestampedObsolete):
    """Represents a document.

    Documents can be posts, videos, etc. Any type of content.

    """
    id = Column(Integer, primary_key=True)

    type = Column(String(32), ForeignKey('document_type.code'), nullable=False)


class DocumentType(TimestampedObsolete):
    """Types of documents ("post", "video", etc)."""
    code = Column(String(32), primary_key=True)

    name = Column(String(255), nullable=False)


class HasDocument(object):
    """Mixin for models that are also documents."""
    @declared_attr
    def document_id(cls):
        """Return a foreign key to the toc.Document model."""
        return Column(Integer, ForeignKey('document.id'))

    @declared_attr
    def document(cls):
        """Return a backref on the toc.Document model."""
        _backref = backref(cls.__tablename__, uselist=False)
        return relationship('Document', backref=_backref)

    def _make_document(self):
        """Create an associated toc.Document object."""
        self.document = Document(type=self.__tablename__)


def _has_document_init(target, args, kwargs):
    """Create the target's associated document if it does not exist."""
    if not target.document_id or not target.document:
        target._make_document()


def _register_has_document_init(mapper, class_):
    """Register the above init event to the HasDocument mixin subclasses."""
    if issubclass(class_, HasDocument):
        event.listen(class_, 'init', _has_document_init)


event.listen(mapper, 'mapper_configured', _register_has_document_init)


class Item(TimestampedObsolete):
    """Represents a item in the table of contents graph."""
    id = Column(Integer, primary_key=True)

    parent_id = Column(Integer, ForeignKey('item.id'))
    children = relationship('Item',
                            backref=backref('parent', remote_side=[id]))

    title = Column(Unicode(255), nullable=False)
    description = Column(UnicodeText())


class Selection(TimestampedObsolete):
    """Holds quotes of various content types."""
    id = Column(Integer, primary_key=True)

    item_id = Column(Integer, ForeignKey('item.id'), nullable=False)
    item = relationship('Item', backref='selections')
    document_id = Column(Integer, ForeignKey('document.id'), nullable=False)
    document = relationship('Document', backref='selections')

    type = Column(String(16), ForeignKey('selector_type.code'),
                  nullable=False)
    # Holds the encoded, selector-type-specific reference to the quote.
    reference = Column(String(255), nullable=False)
    text = Column(UnicodeText)


class SelectorType(TimestampedObsolete):
    """Represents methods for quoting content.

    Examples would be: "text", "video".

    """
    code = Column(String(16), primary_key=True)

    name = Column(String(255), nullable=False)
