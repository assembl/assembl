#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Copyright (C) 2010 Radim Rehurek <radimrehurek@seznam.cz>
# Copyright (C) 2015 Marc-Antoine Parent <maparent@acm.org>
# Licensed under the GNU LGPL v2.1 - http://www.gnu.org/licenses/lgpl.html


"""
Indexed corpus is a mechanism for random-accessing corpora.

While the standard corpus interface in gensim allows iterating over corpus with
`for doc in corpus: pass`, indexed corpus allows accessing the documents with
`corpus[docno]` (in O(1) look-up time).

This functionality is achieved by storing an extra file (by default named the same
as the corpus file plus '.index' suffix) that stores the byte offset of the beginning
of each document.
"""

import logging
import shelve

from gensim import interfaces, utils
from gensim.corpora import IndexedCorpus, MmCorpus
logger = logging.getLogger('gensim.corpora.indexedcorpus')


class _Subcorpus(object):
    def __init__(self, corpus, ids):
        self.corpus = corpus
        self.ids = ids

    def __len__(self):
        return len(self.ids)

    def __iter__(self):
        return (self.corpus[id] for id in self.ids)


class IdIndexedCorpus(IndexedCorpus):

    @classmethod
    def serialize(serializer, fname, corpus, id2word=None, index_fname=None, progress_cnt=None, labels=None, metadata=False):
        """
        Iterate through the document stream `corpus` AS A DICT, saving the documents to `fname`
        and recording byte offset of each document. Save the resulting index
        structure to file `index_fname` (or `fname`.index is not set).

        This relies on the underlying corpus class `serializer` providing (in
        addition to standard iteration):

        * `save_corpus` method that returns a sequence of byte offsets, one for
           each saved document,
        * the `docbyoffset(offset)` method, which returns a document
          positioned at `offset` bytes within the persistent storage (file).

        Example:

        >>> MmCorpus.serialize('test.mm', corpus)
        >>> mm = MmCorpus('test.mm') # `mm` document stream now has random access
        >>> print(mm[42]) # retrieve document no. 42, etc.
        """
        if getattr(corpus, 'fname', None) == fname:
            raise ValueError("identical input vs. output corpus filename, refusing to serialize: %s" % fname)

        if index_fname is None:
            index_fname = utils.smart_extension(fname, '.index')

        key_order = []
        def corpus_as_list():
            for k, c in corpus:
                key_order.append(k)
                yield c

        if progress_cnt is not None:
            if labels is not None:
                offsets = serializer.save_corpus(fname, corpus_as_list(), id2word, labels=labels, progress_cnt=progress_cnt, metadata=metadata)
            else:
                offsets = serializer.save_corpus(fname, corpus_as_list(), id2word, progress_cnt=progress_cnt, metadata=metadata)
        else:
            if labels is not None:
                offsets = serializer.save_corpus(fname, corpus_as_list(), id2word, labels=labels, metadata=metadata)
            else:
                offsets = serializer.save_corpus(fname, corpus_as_list(), id2word, metadata=metadata)

        if offsets is None:
            raise NotImplementedError("called serialize on class %s which doesn't support indexing!" %
                serializer.__name__)
        offsets = dict(zip(key_order, offsets))

        # store offsets persistently, using pickle
        logger.info("saving %s index to %s" % (serializer.__name__, index_fname))
        utils.pickle(offsets, index_fname)

    def __getitem__(self, docno):
        if self.index is None:
            raise RuntimeError("cannot call corpus[docid] without an index")

        return self.docbyoffset(self.index[docno])

    def subcorpus(self, ids):
        return _Subcorpus(self, ids)


class IdMmCorpus(IdIndexedCorpus, MmCorpus):
    pass
