"""These are subclasses of :py:class:`.generic.Content` for web annotation"""
from sqlalchemy import Column, Integer, ForeignKey, DateTime

from .generic import Content
from ..lib.sqla_types import CoerceUnicode
from .langstrings import LangString, Locale


class Webpage(Content):
    """A web page as a content type

    This allows web annotation with annotator_.

    .. _annotator: http://annotatorjs.org/
    """
    __tablename__ = "webpage"
    id = Column(
        Integer, ForeignKey(
            'content.id',
            ondelete='CASCADE'
        ), primary_key=True)
    url = Column(CoerceUnicode, unique=True)
    last_modified_date = Column(DateTime, nullable=True)
    # Should we cache the page content?

    __mapper_args__ = {
        'polymorphic_identity': 'webpage',
    }

    def get_body(self):
        return LangString.EMPTY(self.db)

    def get_title(self):
        return LangString.create(self.url, Locale.NON_LINGUISTIC)

    @classmethod
    def get_instance(cls, uri):
        page = cls.get_by(url=uri)
        if page:
            return page
        return Content.get_instance(uri)

    @classmethod
    def get_database_id(cls, identifier):
        page = cls.get_by(url=identifier)
        if page:
            return page.id
