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

from ..db.models import SQLAlchemyBaseModel
from ..auth.models import RestrictedAccessModel



class Discussion(RestrictedAccessModel):
    """
    A Discussion
    """
    __tablename__ = "discussion"

    id = Column(
        Integer, 
        ForeignKey('restricted_access_model.id', ondelete='CASCADE'),
        primary_key=True
    )

    topic = Column(Unicode(255), nullable=False)

    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)

    table_of_contents = relationship(
        'TableOfContents', 
        uselist=False,
        backref='discussion'
    )
    
    __mapper_args__ = {
        'polymorphic_identity': 'discussion',
    }

    def __init__(self, *args, **kwargs):
        super(Discussion, self).__init__(*args, **kwargs)
        self.table_of_contents = TableOfContents(discussion=self)

    def __repr__(self):
        return "<Discussion '%s'>" % self.topic


class TableOfContents(SQLAlchemyBaseModel):
    """
    Represents a Table of Contents.

    A ToC in Assembl is used to organize the core ideas of a discussion in a
    threaded hierarchy.
    """
    __tablename__ = "table_of_contents"

    id = Column(Integer, primary_key=True)
    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)

    discussion_id = Column(
        Integer,
        ForeignKey('discussion.id')
    )

    def __repr__(self):
        return "<TableOfContents '%s'>" % self.discussion.topic
