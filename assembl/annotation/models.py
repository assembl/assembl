from sqlalchemy import Column, Integer, ForeignKey, DateTime, Unicode, String

from rdflib import URIRef, RDF
from rdflib.extras.infixowl import Property

from ..source.generic import Source, Content
from ..synthesis.models import Extract, Idea, Discussion
from ..auth.models import (IdentityProvider, IdentityProviderAccount,
                           AgentProfile, AgentAccount)


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
