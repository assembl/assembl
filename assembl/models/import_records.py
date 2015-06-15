from datetime import datetime
from itertools import chain

from sqlalchemy import (
    Column, ForeignKey, Integer, DateTime, UniqueConstraint)
from sqlalchemy import event
from sqlalchemy.orm import (column_property, deferred)
from sqlalchemy.ext.hybrid import (hybrid_property, Comparator)
from virtuoso.alchemy import (IRI_ID, id_to_iri, iri_to_id)

from ..lib.sqla import get_named_object
from . import DiscussionBoundBase, Discussion


class IRIComparator(Comparator):
    def __eq__(self, other):
        return self.__clause_element__() == iri_to_id(other, 0)


class ImportRecord(DiscussionBoundBase):
    __tablename__ = 'import_record'
    __table_args__ = (
        UniqueConstraint('discussion_id', 'external_iri_id'),
    )

    def __init__(self, **kwargs):
        if 'external_iri' in kwargs and 'external_iri_id' not in kwargs:
            kwargs['external_iri_id'] = iri_to_id(kwargs.pop('external_iri'))
        if 'internal_iri' in kwargs and 'internal_iri_id' not in kwargs:
            kwargs['internal_iri_id'] = iri_to_id(kwargs.pop('internal_iri'))
        if 'server_iri' in kwargs and 'server_iri_id' not in kwargs:
            kwargs['server_iri_id'] = iri_to_id(kwargs.pop('server_iri'))
        super(ImportRecord, self).__init__(**kwargs)

    id = Column(Integer, primary_key=True)
    discussion_id = Column(Integer, ForeignKey(Discussion.id), nullable=False)
    external_iri_id = deferred(Column(IRI_ID, nullable=False))
    internal_iri_id = deferred(Column(IRI_ID, nullable=False, index=True))
    server_iri_id = deferred(Column(IRI_ID, nullable=False))
    last_modified = Column(DateTime, default=datetime.utcnow)

    _external_iri_cp = column_property(id_to_iri(
        external_iri_id.columns[0]).label('external_iri'))
    _internal_iri_cp = column_property(id_to_iri(
        internal_iri_id.columns[0]).label('internal_iri'))
    _server_iri_cp = column_property(id_to_iri(
        server_iri_id.columns[0]).label('server_iri'))

    @hybrid_property
    def external_iri(self):
        return self._external_iri_cp

    @external_iri.setter
    def external_iri(self, value):
        self._external_iri_cp = value
        self.external_iri_id = iri_to_id(value)

    @external_iri.comparator
    def external_iri(cls):
        return IRIComparator(cls.external_iri_id)

    @hybrid_property
    def internal_iri(self):
        return self._internal_iri_cp

    @internal_iri.setter
    def internal_iri(self, value):
        self._internal_iri_cp = value
        self.internal_iri_id = iri_to_id(value)

    @internal_iri.comparator
    def internal_iri(cls):
        return IRIComparator(cls.internal_iri_id)

    @hybrid_property
    def server_iri(self):
        return self._server_iri_cp

    @server_iri.setter
    def server_iri(self, value):
        self._server_iri_cp = value
        self.server_iri_id = iri_to_id(value)

    @server_iri.comparator
    def server_iri(cls):
        return IRIComparator(cls.server_iri_id)

    def get_discussion_id(self):
        return self.discussion_id

    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return (cls.iri == discussion_id, )

    @classmethod
    def find_record(cls, ext_iri, discussion_id, server_iri=None):
        q = cls.default_db.query(cls).filter_by(
            discussion_id=discussion_id,
            external_iri=ext_iri)
        if server_iri is not None:
            q = q.filter_by(server_iri=server_iri)
        return q.first()

    @classmethod
    def find_internal_iri(cls, iri, discussion_id, server_iri=None):
        r = cls.find_record(iri, discussion_id, server_iri)
        if r:
            return r.internal_iri


class ImportRecordHandler(object):

    def __init__(self, discussion, server_iri):
        self.discussion_id = discussion.id
        self.db = discussion.db
        self.server_iri = server_iri
        self.future = {}
        self.import_time = datetime.utcnow()
        self.prepare_flush()

    def find_record(self, external_iri, set_import=True):
        if external_iri in self.future:
            return self.future[external_iri]
        ex = ImportRecord.find_record(
            external_iri, self.discussion_id, self.server_iri)
        if ex:
            if set_import:
                ex.last_modified = self.import_time
            return get_named_object(None, ex.internal_iri)

    def __getitem__(self, key):
        return self.find_record(key)

    def add_record(self, external_iri, ob, set_import=True):
        ex = ImportRecord.find_record(
            external_iri, self.discussion_id, self.server_iri)
        if ex:
            if set_import:
                ex.last_modified = self.import_time
        else:
            self.future[external_iri] = ob

    def __setitem__(self, key, value):
        self.add_record(key, value)

    def __delitem__(self, key):
        # Should we allow this?
        if key in self.future:
            del self.future[key]
        else:
            ex = self.find_record(key, False)
            ex.delete()

    def __iter__(self):
        q = self.db.query(ImportRecord).filter_by(
            discussion_id=self.discussion_id,
            server_iri=self.server_iri)
        return chain(self.future.iterkeys(), (i.external_iri for i in q))

    def __len__(self):
        return len(self.future) + self.db.query(ImportRecord).filter_by(
            discussion_id=self.discussion_id,
            server_iri=self.server_iri).count()

    def prepare_flush(self):
        event.listen(
            self.db, "after_flush", lambda: self.add_records(), once=True)

    def add_records(self):
        if self.future:
            for external_iri, ob in self.future:
                self.db.add(ImportRecord(
                    discussion_id=self.discussion_id,
                    external_iri=external_iri,
                    server_iri=self.server_iri,
                    internal_iri=ob.uri_generic(),
                    last_modified=self.import_time))
            self.db.flush()
            self.future = {}
            # There can be another flush.
            # This will fail if we flush between adding objects
            self.prepare_flush()
