import email
from uuid import uuid4

import colander
from colanderalchemy import Column
from sqlalchemy import (DateTime, ForeignKey, Integer, String, Text, Unicode,
                        UnicodeText)
from sqlalchemy.orm import backref, relationship

from . import TimestampedBase
from ..lib import config
from ..lib.email import (add_header, decode_body, decode_header, formatdate,
                         parsedate)
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

    def __str__(self):
        return '%s %s %s' % (self.__class__.__name__, self.id, self.message_id)

    def ensure_msg_id(self):
        """Make sure the post has a message-id. Make one up if needed."""
        if not self.message_id:
            self.message_id = msg_id()

    @classmethod
    def from_email(cls, msg):
        """Make a post out of an email.message.Message object."""
        header = lambda header: decode_header(msg.get(header))
        if not msg.is_multipart():
            body = decode_body(msg)
        elif msg.get_content_type() == 'multipart/alternative':
            body = decode_body(msg.get_payload()[0])
        else:
            raise ValueError('Incomplete support for multipart emails in %s.'
                             % header('message-id'))
        post = cls(date=parsedate(header('date')), author=header('from'),
                   subject=header('subject'), message_id=header('message-id'),
                   body=body)
        if post.message_id is None:
            raise ValueError('Email headers have no message-id.')
        return post

    def to_thread_msg(self):
        """Turn a post into a minimal email.message.Message object.

        Used when threading messages.

        """
        if self.email:
            try:
                msg = email.message_from_string(self.email.message)
            except UnicodeEncodeError, e:
                # Let's go out on a limb and assume the badly encoded message
                # contains text in the UTF-8 charset that just needs to be
                # properly encoded.
                msg_text = self.email.message.encode('utf-8')
                msg = email.message_from_string(msg_text)
        else:
            msg = email.message.Message()
            msg.set_payload('- body omitted -', 'us-ascii')
            add_header(msg, 'Date', self.date, formatdate)
            add_header(msg, 'From', self.author)
            add_header(msg, 'Subject', self.subject)
            add_header(msg, 'Message-ID', self.message_id)
            if self.parent:
                add_header(msg, 'In-Reply-To', self.parent.message_id)
        add_header(msg, 'X-Assembl-Post-ID', self.id, str)

        return msg


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
