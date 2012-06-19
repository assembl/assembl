from sqlalchemy import Column, DateTime, Integer, Text, Unicode

from . import TimestampedBase
from .sautils import BaseOps
from ..lib import email


class Post(TimestampedBase):
    """ Represents a message in the system. """
    __tablename__ = 'posts'

    id = Column(Integer, primary_key=True)

    date = Column(DateTime, nullable=False)
    author = Column(Unicode(1024), nullable=False)
    subject = Column(Unicode(1024))
    body = Column(Text, nullable=False)

    @classmethod
    def from_email(cls, msg):
        """ Make a Post out of an email. """
        return cls(date=email.parsedate(msg['date']), author=msg['from'],
                   subject=msg['subject'], body=msg.get_payload())
