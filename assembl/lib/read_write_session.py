from contextlib import contextmanager

import sqlalchemy.orm as orm

from .logging import getLogger

log = getLogger()


class ReadWriteSession(orm.Session):
    """A session that can divert read queries to a different engine
    Inspired by https://gist.github.com/adhorn/b84dc47175259992d406
    """

    def __init__(self, bind=None, autoflush=False,
                 read_bind=None, readonly=False, **options):
        self.read_bind = read_bind
        if read_bind:
            read_bind.is_readonly = True
        self.readonly = readonly
        orm.Session.__init__(
            self, bind=bind, autoflush=autoflush, **options)

    def get_bind(self, mapper=None, clause=None):
        use_read = self.read_bind and not self._flushing and self.readonly
        log.debug("using %s session%s" % (
            "read" if use_read else "write",
            " while flushing" if self._flushing else ""))
        return self.read_bind if use_read else self.bind

    def set_readonly(self, readonly=True):
        if readonly and self._flushing:
            log.error("cannot set readonly: already flushing")
        else:
            self.readonly = readonly


@contextmanager
def readonly(session):
    was_readonly = session.readonly
    try:
        session.set_readonly()
        yield session
    finally:
        session.set_readonly(was_readonly)
