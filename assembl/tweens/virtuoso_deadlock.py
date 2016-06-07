import time
import random

from transaction.interfaces import TransientError
from sqlalchemy.exc import DBAPIError

# With thanks to rkhayrov in http://stackoverflow.com/questions/18348759/


class DeadlockError(DBAPIError, TransientError):
    pass


def transient_deadlock_tween_factory(handler, registry):
    """This defines a tween that will retry a request if it failed
    thanks to a deadlock in the virtuoso database."""
    def transient_deadlock_tween(request):
        try:
            return handler(request)
        except DBAPIError as e:
            orig = e.orig
            if getattr(orig, 'args', [None])[0] == '40001':
                time.sleep(random.random())
                raise DeadlockError(e.statement, e.params, orig)
            else:
                raise

    return transient_deadlock_tween
