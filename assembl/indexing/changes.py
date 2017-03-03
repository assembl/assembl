import logging
import threading
import os

from transaction.interfaces import ISavepointDataManager, IDataManagerSavepoint
from zope.interface import implementer
import transaction
from elasticsearch.helpers import bulk

from .settings import get_index_settings
from .utils import (
    connect,
#    create_index_and_mapping,
    get_uid,
    get_data,
    get_doc_type_from_uid,
    )

logger = logging.getLogger('assembl.indexing')


def in_tests():
    return os.getenv('_', '').endswith('py.test')


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
        self._settings = get_index_settings()
        self._activated = False

    def _join(self):
        if not self._activated:
            transaction = self.manager.get()
            transaction.join(self)
            self._activated = True

    def index_content(self, content):
        if in_tests():
            return

        uid, data = get_data(content)
        if data:
            self._join()
            doc_type = get_doc_type_from_uid(uid)
            if uid in self._unindex:
                del self._unindex[uid]

            self._index[uid] = data
            self._doc_types.add(doc_type)

    def unindex_content(self, content):
        if in_tests():
            return

        self._join()
        uid, data = get_data(content)
        if uid in self._index:
            del self._index[uid]

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
            bulk(es, actions, chunk_size=self._settings['chunk_size'])

        self._clear()

    def tpc_abort(self, transaction):
        self._clear()


changes = ElasticChanges(transaction.manager)
