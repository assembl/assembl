""" Some utilities for working with SQLAlchemy. """

from datetime import datetime

from sqlalchemy import Column, DateTime, engine_from_config

from pyramid.paster import get_appsettings, setup_logging


def create_engine(config_uri):
    """ Return an SQLAlchemy engine configured as per the provided config. """
    setup_logging(config_uri)
    settings = get_appsettings(config_uri)
    engine = engine_from_config(settings, 'sqlalchemy.')
    return engine


class Timestamped(object):
    """ An automatically timestamped mixin. """
    ins_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    mod_date = Column(DateTime, nullable=False, default=datetime.utcnow)


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
