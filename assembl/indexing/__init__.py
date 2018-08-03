from ..lib.config import get as _get
from pyramid.events import NewRequest
from pyramid.settings import asbool as _asbool

from assembl.indexing.changes import get_changes


def indexing_active():
    return _asbool(_get('use_elasticsearch'))


def join_transaction(event=None):
    if indexing_active():
        get_changes()._join()


def includeme(config):
    """ Initialize changes. """
    # join ElasticChanges datamanager to the transaction at the beginning
    # of the request to avoid joining when the status is Committing
    # If I don't do that, the elasticsearch data manager may actually join
    # the transaction when the transaction is committing, and this fail with an error.
    # The after_insert sqlalchemy event that I use to index an object (and so the
    # elasticsearch data manager join the transaction) is triggered via the session.flush()
    # in the tcp_begin of sqlalchemy data manager. You can't add data managers to a
    # transaction which is in a Committing state.
    config.add_subscriber(join_transaction, NewRequest)
    if indexing_active():
        config.include('.changes')
        config.include('.settings')
