from uuid import uuid4

import colander
from colanderalchemy import Column
from sqlalchemy import (DateTime, ForeignKey, Integer, String, Text, Unicode,
                        UnicodeText)
from sqlalchemy.orm import backref, relationship

from . import TimestampedBase
from ..lib import config
from ..lib.utils import get_eol


def msg_id():
    """Generate a random message-id."""
    return '<%s@%s>' % (uuid4(), config.get('assembl.domain'))


class Post(TimestampedBase):
    """Represents a message in the system."""
    __tablename__ = 'posts'

    id = Column(Integer, primary_key=True)

    date = Column(DateTime, nullable=False,
                  ca_type=colander.DateTime(default_tzinfo=None))
    author = Column(Unicode(1024), nullable=False)
    subject = Column(Unicode(1024))
    email = relationship('Email', uselist=False, backref='post')
    body = Column(UnicodeText, nullable=False)
    message_id = Column(String, nullable=False, default=msg_id)

    parent_id = Column(Integer, ForeignKey('posts.id'))
    children = relationship('Post',
                            backref=backref('parent', remote_side=[id]))

    def __init__(self, *args, **kwargs):
        if not 'message_id' in kwargs:
            kwargs['message_id'] = msg_id()
        super(Post, self).__init__(*args, **kwargs)

    def __str__(self):
        return '%s %s %s' % (self.__class__.__name__, self.id, self.message_id)

    def ensure_msg_id(self):
        """Make sure the post has a message-id. Make one up if needed."""
        if not self.message_id:
            self.message_id = msg_id()


class Email(TimestampedBase):
    """Contains raw email content."""
    __tablename__ = 'emails'

    id = Column(Integer, primary_key=True)

    headers = Column(Text, nullable=False)
    body = Column(Text, nullable=False)

    post_id = Column(Integer, ForeignKey('posts.id'))

    @property
    def message(self):
        """Return the whole message by concatenating headers and body."""
        return get_eol(self.headers).join([self.headers, '', self.body])
