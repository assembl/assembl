from sqlalchemy import Column, Integer, ForeignKey, DateTime, Unicode, String

from ..source.models.generic import Source, Content


class Webpage(Content):
    __tablename__ = "webpage"
    id = Column(
        Integer, ForeignKey(
            'content.id',
            ondelete='CASCADE'
        ), primary_key=True)
    url = Column(Unicode, unique=True)
    last_modified_date = Column(DateTime, nullable=True)
    # Should we cache the page content?

    __mapper_args__ = {
        'polymorphic_identity': 'webpage',
    }

    def get_title(self):
        return self.url
