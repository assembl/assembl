from datetime import datetime

from sqlalchemy.orm import relationship, backref

from sqlalchemy import (
    Column, 
    Boolean,
    Integer, 
    Unicode, 
    UnicodeText, 
    DateTime,
    ForeignKey,
    desc
)

from ..auth.models import RestrictedAccessModel



class TableOfContents(RestrictedAccessModel):
    """
    Represents a Table of Contents.

    A ToC in Assembl is used to organize the core ideas of a discussion in a
    threaded hierarchy.
    """
    __tablename__ = "table_of_contents"

    id = Column(
        Integer, 
        ForeignKey('restricted_access_model.id', ondelete='CASCADE'),
        primary_key=True
    )

    topic = Column(Unicode(115), nullable=False)

    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)

    __mapper_args__ = {
        'polymorphic_identity': 'table_of_contents',
    }

    def __repr__(self):
        return "<TableOfContents '%s'>" % self.topic
