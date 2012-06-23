from sqlalchemy import Column, event, Integer, MetaData, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import mapper, scoped_session, sessionmaker
from zope.sqlalchemy import ZopeTransactionExtension

from ..lib.sautils import insert_timestamp, Timestamped, update_timestamp


def _declarative_bases(metadata):
    """ Return all declarative bases bound to a single metadata object. """
    return (declarative_base(metadata=metadata),
            declarative_base(cls=Timestamped, metadata=metadata))


DBSession = scoped_session(sessionmaker(extension=ZopeTransactionExtension()))

metadata = MetaData()
Base, TimestampedBase = _declarative_bases(metadata)

event.listen(mapper, 'before_insert', insert_timestamp)
event.listen(mapper, 'before_update', update_timestamp)


class MyModel(TimestampedBase):
    __tablename__ = 'models'
    id = Column(Integer, primary_key=True)
    name = Column(Text, unique=True)
    value = Column(Integer)

    def __init__(self, name, value):
        self.name = name
        self.value = value


from .post import Post
