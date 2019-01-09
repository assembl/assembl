# from flask.ext.sqlalchemy import SQLAlchemy, get_state
import sqlalchemy.orm as orm
from functools import partial
from .logging import getLogger

log = getLogger()


class ReadWriteSession(orm.Session):
    """A session that can divert read queries to a different engine
    Inspired by https://gist.github.com/adhorn/b84dc47175259992d406
    """

    def __init__(self, bind=None, autoflush=False,
                 read_bind=None, reading=False, **options):
        self.read_bind = read_bind
        self.reading = reading
        orm.Session.__init__(
            self, bind=bind, autoflush=autoflush, **options)

    def get_bind(self, mapper=None, clause=None):
        use_read = self.read_bind and not self._flushing and self.reading
        log.debug("using %s session%s" % (
            "read" if use_read else "write",
            " while flushing" if self._flushing else ""))
        return self.read_bind if use_read else self.bind

    def set_reading(self, reading=True):
        if reading and self._flushing:
            log.error("cannot set reading: already flushing")
        else:
            self.reading = reading

# TODO: reentrant context manager.
