""" Some utilities for working with SQLAlchemy. """

from datetime import datetime

from sqlalchemy import Column, DateTime

_DB = None


class BaseOps(object):
    """ Basic database operations are abstracted away in this class. """

    def iteritems(self, include=None, exclude=None):
        """ Return a generator that iterates through model columns. """
        if include and exclude:
            raise ValueError('Args include and exclude are mutually exclusive')
        for c in self.__table__.columns:
            if ((not include or c.name in include)
            and (not exclude or c.name not in exclude)):
                yield(c.name, getattr(self, c.name))


class Timestamped(BaseOps):
    """ An automatically timestamped mixin. """
    ins_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    mod_date = Column(DateTime, nullable=False, default=datetime.utcnow)

    def iteritems(self, include=None, exclude=None):
        stamps = ['ins_date', 'mod_date']
        if exclude is None:
            exclude = stamps
        elif len(exclude) > 0:
            exclude = set(exclude) | set(stamps)
        return super(Timestamped, self).iteritems(exclude=exclude,
                                                  include=include)


def insert_timestamp(mapper, connection, target):
    """ Initialize timestamps on models that have these fields. """
    timestamp = datetime.utcnow()
    if hasattr(target, 'ins_date'):
        target.ins_date = timestamp
    if hasattr(target, 'mod_date'):
        target.mod_date = timestamp


def update_timestamp(mapper, connection, target):
    """ Update the modified date on models that have this field. """
    if hasattr(target, 'mod_date'):
        target.mod_date = datetime.utcnow()
