from migrate import *
from sqlalchemy import *

from assembl.models import _declarative_bases

Base, TimestampedBase = _declarative_bases(MetaData())


def setup_meta(migrate_engine):
    Base.metadata.bind = migrate_engine
    TimestampedBase.metadata.bind = migrate_engine


class Post(TimestampedBase):
    __tablename__ = 'posts'
    id = Column(Integer, primary_key=True)
    date = Column(DateTime, nullable=False)
    author = Column(Unicode(1024), nullable=False)
    subject = Column(Unicode(1024))
    body = Column(Text, nullable=False)


def upgrade(migrate_engine):
    setup_meta(migrate_engine)
    Post.__table__.create()


def downgrade(migrate_engine):
    setup_meta(migrate_engine)
    Post.__table__.drop()
