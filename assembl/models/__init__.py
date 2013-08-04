from sqlalchemy import Column, Integer, Text

from ..lib.sqla import DBSession, Base, TimestampedBase, metadata, ObsoleteBase, TimestampedObsolete

class MyModel(TimestampedObsolete):
    __tablename__ = 'models'
    id = Column(Integer, primary_key=True)
    name = Column(Text, unique=True)
    value = Column(Integer)

    def __init__(self, name, value):
        self.name = name
        self.value = value


from .post import Email, Post
from .toc import Document, DocumentType, Item, Selection, SelectorType
from ..auth.models import (
    Actor,
    User,
    RestrictedAccessModel,
    Permission,
    Action,
    )
from ..source.models import (
    Source,
    Content,
    Mailbox,
    Post,
    Email,
)
from ..synthesis.models import (
    Discussion,
    TableOfContents,
    Idea,
    Extract,
    )
