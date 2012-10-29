from uuid import uuid4

import colander
from colanderalchemy import Column
from sqlalchemy import (DateTime, ForeignKey, Integer, String, Text, Unicode,
                        UnicodeText, event, func, literal_column)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import aliased, backref, relationship

from . import TimestampedBase
from .toc import HasDocument
from ..lib import config
from ..lib.utils import get_eol


def msg_id():
    """Generate a random message-id."""
    return '<%s@%s>' % (uuid4(), config.get('assembl.domain'))


class Post(HasDocument, TimestampedBase):
    """Represents a message in the system."""
    id = Column(Integer, primary_key=True)

    date = Column(DateTime, nullable=False,
                  ca_type=colander.DateTime(default_tzinfo=None))
    author = Column(Unicode(1024), nullable=False)
    subject = Column(Unicode(1024))
    email = relationship('Email', uselist=False, backref='post')
    body = Column(UnicodeText, nullable=False)
    message_id = Column(String, nullable=False, default=msg_id)

    parent_id = Column(Integer, ForeignKey('post.id'))
    children = relationship('Post',
                            backref=backref('parent', remote_side=[id]))

    def __str__(self):
        return '%s %s %s' % (self.__class__.__name__, self.id, self.message_id)

    def ensure_msg_id(self):
        """Make sure the post has a message-id. Make one up if needed."""
        if not self.message_id:
            self.message_id = msg_id()

    def get_thread(self, levels=None):
        """Return a query that includes the post and its following thread.

        The `levels` argument limits how deep to search from the root. The root
        post itself is at level 1.

        The returned posts will be sorted by distance from the root.

        Beware: we use a recursive query via a CTE and the PostgreSQL-specific
        ARRAY type. Blame this guy for that choice:
        http://explainextended.com/2009/09/24/adjacency-list-vs-nested-sets-postgresql/

        Also, that other guy provided insight into using CTE queries:
        http://stackoverflow.com/questions/11994092/how-can-i-perform-this-recursive-common-table-expression-in-sqlalchemy

        A literal column and an op complement nicely all this craziness.

        All I can say is SQLAlchemy kicks ass, and so does PostgreSQL.

        """
        level = literal_column('ARRAY[id]', type_=ARRAY(Integer))
        post = self.db.query(self.__class__) \
                      .add_columns(level.label('level')) \
                      .filter(self.__class__.id == self.id) \
                      .cte(name='thread', recursive=True)
        post_alias = aliased(post, name='post')
        replies_alias = aliased(self.__class__, name='replies')
        cumul_level = post_alias.c.level.op('||')(replies_alias.id)
        parent_link = replies_alias.parent_id == post_alias.c.id
        children = self.db.query(replies_alias).add_columns(cumul_level) \
                          .filter(parent_link)

        if levels:
            level_limit = func.array_upper(post_alias.c.level, 1) < levels
            children = children.filter(level_limit)

        return self.db.query(post.union_all(children)).order_by(post.c.level)


def _post_init(target, args, kwargs):
    """Make sure all new instances have a message_id at creation time."""
    if not 'message_id' in kwargs:
        target.ensure_msg_id()


event.listen(Post, 'init', _post_init)


class Email(TimestampedBase):
    """Contains raw email content."""
    id = Column(Integer, primary_key=True)

    headers = Column(Text, nullable=False)
    body = Column(Text, nullable=False)

    post_id = Column(Integer, ForeignKey('post.id'))

    @property
    def message(self):
        """Return the whole message by concatenating headers and body."""
        return get_eol(self.headers).join([self.headers, '', self.body])
