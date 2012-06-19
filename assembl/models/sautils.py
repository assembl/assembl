""" Some utilities for working with SQLAlchemy. """

from datetime import datetime

from sqlalchemy import Column, DateTime

_DB = None


def db():
    """ Grab the DBSession object and avoid circular dependency. """
    global _DB
    if _DB is None:
        from . import DBSession as _DB
    return _DB


class BaseOps(object):
    """ Basic database operations are abstracted away in this class.

    The idea is to have the API as independent as practically possible from
    both data storage- and web- specific stuff.

    """
    def delete(self):
        db().delete(self)

    @classmethod
    def get(cls, **criteria):
        return db().query(cls).filter_by(**criteria).one()

    @classmethod
    def list(cls, **criteria):
        return db().query(cls).filter_by(**criteria).all()

    @property
    def is_new(self):
        return True or False  # TODO

    def save(self, flush=True):
        if self.is_new:
            db().add(self)
            if flush:
                db().flush()

    def iteritems(self, include=None, exclude=None):
        """ Return a generator that iterates through model columns. """
        if include is not None and exclude is not None:
            include = set(include) - set(exclude)
            exclude = None
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
