"""
You can read http://transaction.readthedocs.io/en/latest/ to know more about
data (resource) managers participating in a transaction. We have here two
data managers in the transaction, sqlalchemy data manager from zope.sqlalchemy
(see venv/lib/python2.7/site-packages/zope/sqlalchemy/datamanager.py), and here
elasticsearch.
We use an elasticsearch data manager to queue all changes and only put
the changes to elasticsearch if postgres successfully committed the transaction.

When a commit occurs, the data managers are first sorted by their sortKey,
sqlalchemy is first (key is "~sqlalchemy..."), elasticsearch is second
(key is "ZZZZZ..."). Here is the workflow:

- sqlalchemy tpc_begin() does session.flush()
- elasticsearch (changes.py) tpc_begin() does nothing
- sqlalchemy commit() expires objects
- elasticsearch commit() does nothing
- sqlalchemy tpc_vote() commits to postgres. If an exception occurs,
  it will call tpc_abort on all resource managers, so clearing pending changes
  for elasticsearch data manager.
- elasticsearch tpc_vote() does nothing
- sqlalchemy tpc_finish() does nothing
- elasticsearch tpc_finish() write to elasticsearch. If an exception occurs,
  tpc_abort will be called on all resources managers, but here the changes are
  already committed to postgres, so it actually doesn't really do anything.
  But you get a 500 http code.

For the savepoint stuff, you can actually at any moment in your code use
`savepoint = transaction.savepoint()` and if there is an exception,
rollback with `savepoint.rollback()` to return the transaction to this saved
state. For postgres, this is implemented with nested transaction if supported.

If an object is modified several times during the transaction, only the last
modification (including all previous changes) is kept. There is only a single
request to elasticsearch at the end of the transaction.
We are using the elasticsearch bulk REST api to index several documents
in one request. It's just a PUT request and it returns immediately.
The indexing in elasticsearch is then done asynchronously.
If by any bad luck, the elasticsearch is not responding, the postgres database
and elasticsearch will be out of sync. We can always reindex completely the
elasticsearch index to sync it again with the postgres database.
"""

import logging
import threading

from transaction.interfaces import ISavepointDataManager, IDataManagerSavepoint
from zope.interface import implementer
import transaction
from elasticsearch.helpers import bulk

from assembl.lib import config
from .settings import get_index_settings
from .utils import (
    connect,
#    create_index_and_mapping,
    get_uid,
    get_data,
    get_doc_type_from_uid,
    )

logger = logging.getLogger('assembl.indexing')


@implementer(IDataManagerSavepoint)
class ElasticSavepoint(object):

    def __init__(self, manager, index, unindex):
        self.manager = manager
        self._index = index.copy()
        self._unindex = unindex.copy()
        # self._unindex key: uid, value: {doc_type, _parent} which is needed to
        # unindex in elasticsearch)

    def rollback(self):
        self.manager._index = self._index
        self.manager._unindex = self._unindex


@implementer(ISavepointDataManager)
class ElasticChanges(threading.local):

    def __init__(self, manager):
        self.manager = manager
        self._clear()

    def _clear(self):
        self._index = {}
        self._unindex = {}
        self._settings = None
        self._doc_types = set()
        self._settings = get_index_settings(config)
        self._activated = False

    def _join(self):
        if not self._activated:
            transaction = self.manager.get()
            transaction.join(self)
            self._activated = True

    def index_content(self, content):
        uid, data = get_data(content)
        if data:
            self._join()
            doc_type = get_doc_type_from_uid(uid)
            if uid in self._unindex:
                del self._unindex[uid]

            self._index[uid] = data
            self._doc_types.add(doc_type)

    def unindex_content(self, content):
        self._join()
        uid, data = get_data(content)
        if uid in self._index:
            del self._index[uid]

        # Proposition posts do not have uid's
        if not uid:
            return
        doc_type = get_doc_type_from_uid(uid)
        self._unindex[uid] = {
            'doc_type': doc_type,
            '_parent': data.get('_parent', None)
        }

    def savepoint(self):
        return ElasticSavepoint(self, self._index, self._unindex)

    def commit(self, transaction):
        pass

    def sortKey(self):
        return 'Z' * 100

    def abort(self, transaction):
        self._clear()

    def tpc_begin(self, transaction):
        pass

    def tpc_vote(self, transaction):
        pass
# the mapping is static
#        if self._index or self._unindex:
#            create_index_and_mapping(index_name=self._settings['index_name'],
#                                     doc_types=self._doc_types)

    def tpc_finish(self, transaction):
        if self._index or self._unindex:
            index_name = self._settings['index_name']

            def get_actions(index, unindex):
                for uid, data in index.iteritems():
                    doc_type = get_doc_type_from_uid(uid)
                    parent = data.pop('_parent', None)
                    action = {'_op_type': 'index',
                              '_index': index_name,
                              '_type': doc_type,
                              '_id': uid,
                              '_source': data}
                    if parent is not None:
                        action['_parent'] = parent

                    yield action

                for uid, data in unindex.iteritems():
                    doc_type = data['doc_type']
                    parent = data['_parent']
                    action = {'_op_type': 'delete',
                              '_index': index_name,
                              '_type': doc_type,
                              '_id': uid}
                    if parent is not None:
                        action['_parent'] = parent

                    yield action

            actions = get_actions(self._index, self._unindex)
            es = connect()
            bulk(es, actions, chunk_size=self._settings['chunk_size'],
                raise_on_error=False)
            # set raise_on_error=False to not raise a BulkIndexError and so a transaction error (shouldn't happen in tpc_finish)
            # when we try to unindex an idea that was not indexed (this is
            # the case for hidden ideas associated to a synthesis)
            # Example of item in unindex:
            # {'idea:2580': {'_parent': None, 'doc_type': 'idea'}
            # and the resulting error:
            # {u'delete': {u'status': 404, u'_type': u'idea', u'_index': u'assembl',
            # u'_shards': {u'successful': 1, u'failed': 0, u'total': 1},
            # u'_version': 1, u'result': u'not_found', u'found': False, u'_id': u'idea:2580'}}

        self._clear()

    def tpc_abort(self, transaction):
        self._clear()


_changes = None


def get_changes():
    global _changes
    return _changes


def configure_indexing():
    global _changes
    _changes = ElasticChanges(transaction.manager)


def includeme(config):
    """ Initialize changes. """
    configure_indexing()
