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

import itertools

import logging
import numpy

from gensim import utils
from gensim.corpora import IndexedCorpus, MmCorpus
logger = logging.getLogger('gensim.corpora.indexedcorpus')


class IdSlicedCorpus(utils.SlicedCorpus):
    def __iter__(self):
        # TODO: optimize
        if isinstance(self.slice_, slice):
            return itertools.islice(self.corpus, self.slice_.start,
                                    self.slice_.stop, self.slice_.step)
        else:
            # TODO: optimize
            return (self.corpus[id] for id in self.slice_)


class IdMmCorpus(MmCorpus):

    def __init__(self, fname):
        super(IdMmCorpus, self).__init__(fname)
        try:
            dockeys_fname = utils.smart_extension(fname, '.dockeys')
            self.dockeys = utils.unpickle(dockeys_fname)
            self.key_to_index = {k:n for (n, k) in enumerate(self.dockeys)}
            logger.info("loaded dockey index from %s" % dockeys_fname)
        except:
            self.dockeys = None

    @classmethod
    def serialize(serializer, fname, corpus, id2word=None, index_fname=None,
                  progress_cnt=None, labels=None, metadata=False,
                  dockeys_fname=None):
        key_order = []

        def corpus_as_list():
            for k, c in corpus:
                key_order.append(k)
                yield c
        IndexedCorpus.serialize.im_func(
            serializer, fname, corpus_as_list(), id2word,
            index_fname, progress_cnt, labels, metadata)
        dockeys_fname = dockeys_fname or utils.smart_extension(
            fname, '.dockeys')
        utils.pickle(key_order, dockeys_fname)

    def __getitem__(self, docno):
        if self.index is None:
            raise RuntimeError("cannot call corpus[docid] without an index")

        if isinstance(docno, (int, numpy.integer)):
            return self.docbyoffset(self.index[self.key_to_index[docno]])
        elif isinstance(docno, (slice, list, numpy.ndarray)):
            return IdSlicedCorpus(self, docno)
        else:
            raise ValueError('Unrecognised value for docno, use either a single integer, a slice or a numpy.ndarray')
