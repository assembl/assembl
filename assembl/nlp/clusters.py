from collections import defaultdict
from os.path import join, exists
from os import makedirs, unlink
from itertools import chain, groupby
from random import Random

from sqlalchemy import (text, column, bindparam)
from sqlalchemy.orm import defer
from gensim import corpora, models as gmodels, similarities
from gensim.utils import tokenize as gtokenize
import numpy as np
from scipy.sparse import lil_matrix
import sklearn.cluster
from sklearn.metrics.pairwise import pairwise_distances
from sklearn.metrics.cluster.unsupervised import (
    _intra_cluster_distance, _nearest_cluster_distance)
from sklearn import metrics
from .optics import Optics

from assembl.lib.config import get_config
from assembl.models import Content, Idea, Discussion, RootIdea, Post, IdeaLink
from .indexedcorpus import IdMmCorpus
from . import (
    get_stop_words, get_stemmer, DummyStemmer, ReversibleStemmer)

nlp_data = 'var/nlp'
DICTIONARY_FNAME = 'dico.dict'
STEMS_FNAME = 'stems.dict'
PHRASES_FNAME = 'phrases.model'
CORPUS_FNAME = 'posts.mm'


class Tokenizer(object):
    def __init__(self, lang):
        self.lang = lang
        dirname = join(nlp_data, lang)
        stemmer = get_stemmer(lang)
        # Actually it might be better to go phrases (longer),
        # then stop words filtering, then stemming
        # on non-phrase. BUT phrases may require stemming too.
        if not isinstance(stemmer, DummyStemmer):
            stemmer = ReversibleStemmer(
                stemmer, join(dirname, STEMS_FNAME))
        self.stemmer = stemmer
        self.stop_words = get_stop_words(lang)

    def tokenize(self, text):
        return [
            self.stemmer.stemWord(word)
            for word in gtokenize(text, True)
            if word not in self.stop_words]

    def tokenize_post(self, post):
        subject = post.subject or ""
        if subject.lower().split() in ('re:', 'comment'):
            subject = ''
        else:
            subject += ' '
        text = subject + post.get_body_as_text()
        return self.tokenize(text)

    def save(self):
        if not isinstance(self.stemmer, DummyStemmer):
            self.stemmer.save()


class BOWizer(object):
    def __init__(self, lang, tokenizer=None, load=True):
        self.lang = lang
        self.tokenizer = tokenizer or Tokenizer(lang)
        dirname = join(nlp_data, lang)
        dict_fname = join(dirname, DICTIONARY_FNAME)
        phrase_fname = join(dirname, PHRASES_FNAME)
        if load and exists(phrase_fname):
            self.phrases = gmodels.Phrases.load(phrase_fname)
        else:
            self.phrases = gmodels.Phrases()
        if load and exists(dict_fname):
            self.dictionary = corpora.Dictionary.load(dict_fname)
        else:
            self.dictionary = corpora.Dictionary()

    def text_to_bow(self, text):
        return self.dictionary.doc2bow(self.phrases[
            self.tokenizer.tokenize(text)])

    def post_to_bow(self, post):
        return self.dictionary.doc2bow(self.phrases[
            self.tokenizer.tokenize_post(post)])

    def save(self):
        dirname = dirname = join(nlp_data, self.lang)
        self.tokenizer.save()
        self.phrases.save(join(dirname, PHRASES_FNAME))
        self.dictionary.save(join(dirname, DICTIONARY_FNAME))


def identity(x):
    return x


class Scrambler(object):
    def __init__(self, seed):
        self.seed = seed
        self.reset()

    def reset(self):
        self.scrambler = Random()
        self.scrambler.seed(self.seed)
        self.results = []

    def next_bool(self):
        val = self.scrambler.randint(0, 1)
        self.results.append(str(val))
        return bool(val)

    def add_true_values(self, nvalues):
        self.results.extend(["1"]*nvalues)

    def __len__(self):
        return len(self.results)

    def __str__(self):
        return ''.join(self.results)


class SemanticAnalysisData(object):
    _corpora = None
    _corpus = None
    _dictionary = None
    _post_ids = None
    _tfidf_model = None
    _gensim_model = None
    _subcorpus = None
    _similarity_matrix = None
    _stemmer = None
    _trans = None
    _topic_intensities = None
    _model_matrix = None
    _ideas_by_post = None
    _idea_hry = None
    _narrowest_ideas_by_post = None
    _broadest_ideas_by_post = None
    _idea_children = None
    _ideas = None
    _posts = None
    _post_ancestry = None
    _post_texts = None

    # data used by semantic analysis
    def __init__(self, discussion, num_topics=200, min_samples=4, eps=None,
                 model_cls=None, metric=None, user_id=None, test_code=None):
        self.discussion = discussion
        self.num_topics = num_topics
        self.min_samples = min_samples
        self.eps = eps
        self.metric = metric or 'cosine'
        self.model_cls = model_cls or gmodels.lsimodel.LsiModel
        self.test_code = test_code
        self.user_id = user_id
        self._ideas_by_post = {}
        self._posts_by_idea = {}
        # self._direct_ideas_by_post = {}
        self._posts = {}
        self.scrambler = None
        if test_code:
            self.scrambler = Scrambler(
                get_config().get('session.secret')
                + self.test_code + self.discussion.slug)

    def get_ideas_of_post(self, post_id):
        if post_id not in self._ideas_by_post:
            self._ideas_by_post[post_id] = \
                Idea.get_idea_ids_showing_post(post_id)
        return self._ideas_by_post[post_id]

    def get_posts_of_idea(self, idea_id):
        # competes with get_ideas_of_post. Not clear what's most efficient,
        # It will depend on discussion shape.
        if idea_id not in self._posts_by_idea:
            discussion = self.discussion
            related = text(
                Idea._get_related_posts_statement(),
                bindparams=[bindparam('root_idea_id', idea_id),
                            bindparam('discussion_id', discussion.id)]
                ).columns(column('post_id')).alias('related')
            post_ids = discussion.db.query(Content.id).join(
                related, Content.id == related.c.post_id)
            post_ids = [x for (x,) in post_ids]
            post_ids = np.array(post_ids)
            post_ids.sort()
            self._posts_by_idea[idea_id] = post_ids
        return self._posts_by_idea[idea_id]

    @property
    def db(self):
        return self.discussion.db

    @property
    def discussion_url(self):
        discussion = self.discussion
        return str("%s/%s/" % (discussion.get_base_url(), discussion.slug))

    @property
    def idea_hry(self):
        if self._idea_hry is None:
            db = self.discussion.db
            self._idea_hry = dict(db.query(
                IdeaLink.target_id, IdeaLink.source_id).join(
                Idea, Idea.id == IdeaLink.source_id).filter(
                IdeaLink.tombstone_date == None,
                Idea.discussion_id == self.discussion.id))
        return self._idea_hry

    @property
    def idea_children(self):
        if self._idea_children is None:
            idea_children = defaultdict(list)
            for child, parent in self.idea_hry.items():
                idea_children[parent].append(child)
            self._idea_children = idea_children
        return self._idea_children

    @property
    def ideas_by_post(self):
        ideas_by_post = self._ideas_by_post
        post_ids = self.post_ids
        if len(ideas_by_post) < len(post_ids):
            for post_id in post_ids:
                if post_id not in ideas_by_post:
                    ideas_by_post[post_id] = self.get_ideas_of_post(post_id)
            # now that we have everything, populate _posts_by_idea
            posts_by_idea = defaultdict(list)
            for post_id, idea_ids in ideas_by_post.iteritems():
                for idea_id in idea_ids:
                    posts_by_idea[idea_id].append(post_id)
            self._posts_by_idea = posts_by_idea
        return ideas_by_post

    @property
    def ideas(self):
        if self._ideas is None:
            discussion = self.discussion
            ideas = discussion.db.query(Idea).filter_by(
                discussion_id=discussion.id)
            self._ideas = {i.id: i for i in ideas}
        return self._ideas

    @property
    def posts(self):
        if self._posts is None:
            discussion = self.discussion
            posts = discussion.db.query(Content).filter_by(
                discussion_id=discussion.id)
            self._posts = {p.id: p for p in posts}
        return self._posts

    @property
    def post_texts(self):
        if self._post_texts is None:
            self._post_texts = dict(
                self.db.query(Content.id, Content.body))
        return self._post_texts

    @property
    def post_ancestry(self):
        if self._post_ancestry is None:
            def as_chain(post_id, ancestry):
                ancestry = [int(i) for i in ancestry.split(',') if i]
                ancestry.append(post_id)
                return ancestry

            self._post_ancestry = {
                id: as_chain(id, a) for (id, a)
                in self.db.query(Post.id, Post.ancestry)}
        return self._post_ancestry

    # def get_direct_ideas_of_post(self, post_id):
    #     if post_id not in self._direct_ideas_by_post:
    #         self._direct_ideas_by_post[post_id] = \
    #             Idea.get_idea_ids_showing_post(post_id, True, False)
    #     return self._direct_ideas_by_post[post_id]

    @property
    def narrowest_ideas_by_post(self):
        # Use narrowest categories
        # not the same as direct ideas, which may include broad direct links.
        if self._narrowest_ideas_by_post is None:
            idea_hry = self.idea_hry
            narrowest_ideas_by_post = {}
            for post_id, idea_ids in self.ideas_by_post.items():
                if idea_ids:
                    idea_ids = set(idea_ids)
                    clean = set(idea_ids)
                    for idea_id in idea_ids:
                        current = idea_id
                        while current in idea_hry:
                            current = idea_hry[current]
                            if current in idea_ids and current in clean:
                                clean.remove(current)
                    clean = list(clean)
                    clean.sort()
                    clean = tuple(clean)
                else:
                    clean = ()
                narrowest_ideas_by_post[post_id] = clean
                # print post_id, len(idea_ids), len(clean)

            self._narrowest_ideas_by_post = narrowest_ideas_by_post
        return self._narrowest_ideas_by_post

    @property
    def broadest_ideas_by_post(self):
        # Use narrowest categories
        # not the same as direct ideas, which may include broad direct links.
        if self._broadest_ideas_by_post is None:
            idea_hry = self.idea_hry
            broadest_ideas_by_post = {}
            for post_id, idea_ids in self.ideas_by_post.items():
                if not idea_ids:
                    continue
                idea_ids = set(idea_ids)
                clean = set()
                for idea_id in idea_ids:
                    current = idea_id
                    while current in idea_hry:
                        current = idea_hry[current]
                        if current in idea_ids:
                            break
                    else:
                        clean.add(idea_id)
                broadest_ideas_by_post[post_id] = list(clean)
            # print post_id, len(idea_ids), len(clean)
            self._broadest_ideas_by_post = broadest_ideas_by_post
        return self._broadest_ideas_by_post

    def create_dictionaries(self, all_languages=False):
        db = self.discussion.db
        by_main_lang = defaultdict(list)
        default_locales = get_config().get(
            'available_languages', 'fr_CA en_CA').split()
        my_discussion_lang = None
        for d_id, locales in db.query(
                Discussion.id, Discussion.preferred_locales).all():
            locales = locales.split() if locales else default_locales
            main_lang = locales[0].split('_')[0]
            by_main_lang[main_lang].append(d_id)
            if self.discussion.id == d_id:
                my_discussion_lang = main_lang
        corpora = {}
        for lang, discussion_ids in by_main_lang.iteritems():
            if my_discussion_lang != lang and not all_languages:
                continue
            dirname = join(nlp_data, lang)
            if not exists(dirname):
                makedirs(dirname)
            corpus_fname = join(dirname, CORPUS_FNAME)
            if exists(corpus_fname):
                corpus = IdMmCorpus(corpus_fname)
                doc_count = db.query(Content).with_polymorphic(
                    Content).options(defer(Content.like_count)).join(
                    Discussion).filter(Discussion.id.in_(discussion_ids)
                                       ).count()
                if corpus.num_docs == doc_count:
                    corpora[lang] = corpus
                    if my_discussion_lang == lang:
                        self._corpus = corpus
                    continue
            tokenizer = Tokenizer(lang)
            bowizer = BOWizer(lang, tokenizer, False)
            posts = db.query(Content).join(Discussion).filter(
                Discussion.id.in_(discussion_ids))
            bowizer.phrases.add_vocab((
                tokenizer.tokenize_post(post) for post in posts))
            bowizer.dictionary.add_documents((
                bowizer.phrases[tokenizer.tokenize_post(post)]
                for post in posts))
            IdMmCorpus.serialize(corpus_fname, (
                (post.id, bowizer.post_to_bow(post))
                for post in posts))
            bowizer.save()
            corpus = IdMmCorpus(corpus_fname)
            corpora[lang] = corpus
            if my_discussion_lang == lang:
                self._corpus = corpus
        return corpora

    @property
    def lang(self):
        return self.discussion.discussion_locales[0].split('_')[0]

    @property
    def dirname(self):
        return join(nlp_data, self.lang)

    @property
    def corpora(self):
        if self._corpora is None:
            self._corpora = self.create_dictionaries()
        return self._corpora

    @property
    def corpus(self):
        if self._corpus is None:
            self._corpus = self.corpora[self.lang]
        return self._corpus

    @property
    def dictionary(self):
        if self._dictionary is None:
            dict_fname = join(self.dirname, DICTIONARY_FNAME)
            self._dictionary = corpora.Dictionary.load(dict_fname)
        return self._dictionary

    @property
    def post_ids_query(self):
        return self.discussion.db.query(Content.id).filter_by(
            discussion_id=self.discussion.id)

    @property
    def post_ids(self):
        if self._post_ids is None:
            post_ids = np.array([x for (x,) in self.post_ids_query])
            post_ids.sort()
            self._post_ids = post_ids
        return self._post_ids

    @property
    def subcorpus(self):
        if self._subcorpus is None:
            self._subcorpus = self.corpus[self.post_ids]
        return self._subcorpus

    @property
    def tfidf_model(self):
        if self._tfidf_model is None:
            doc_count = self.post_ids_query.count()
            if doc_count < 10:
                return None
            dictionary = self.dictionary
            tfidf_model = gmodels.TfidfModel(id2word=dictionary)
            tfidf_fname = join(self.dirname, "tfidf_%d.model" % (
                self.discussion.id,))
            if exists(tfidf_fname):
                subcorpus = self.subcorpus
                tfidf_model = tfidf_model.load(tfidf_fname)
                # assumption: count implies identity.
                # Wrong in corner cases: hidden, etc.
                if tfidf_model.num_docs != doc_count:
                    unlink(tfidf_fname)
                    tfidf_model = gmodels.TfidfModel(id2word=dictionary)
            if tfidf_model.num_docs != doc_count:
                tfidf_model.initialize(subcorpus)
                tfidf_model.save(tfidf_fname)
            self._tfidf_model = tfidf_model
        return self._tfidf_model

    @property
    def gensim_model(self):
        if self._gensim_model is None:
            doc_count = self.post_ids_query.count()
            if doc_count < 10:
                return None
            dictionary = self.dictionary
            discussion = self.discussion
            model_fname = join(self.dirname, "model_%s_%d.model" % (
                self.model_cls.__name__, discussion.id,))
            model_kwargs = {}  # self.gensim_model_kwargs
            gensim_model = self.model_cls(
                id2word=dictionary, num_topics=self.num_topics, **model_kwargs)
            if exists(model_fname):
                gensim_model = gensim_model.load(model_fname)
                same_kwargs = all((
                    getattr(gensim_model, k) == v
                    for (k, v) in model_kwargs.iteritems()))
                same_kwargs = same_kwargs and getattr(
                    gensim_model, 'num_updates', doc_count) == doc_count
                if not (same_kwargs
                        and gensim_model.num_topics == self.num_topics
                        and gensim_model.docs_processed == doc_count):
                    unlink(model_fname)
                    gensim_model = self.model_cls(
                        id2word=dictionary,
                        num_topics=self.num_topics, **model_kwargs)
            if gensim_model.docs_processed != doc_count:
                subcorpus = self.subcorpus
                tfidf_corpus = self.tfidf_model[subcorpus]
                if getattr(gensim_model, 'update', None):
                    gensim_model.update(tfidf_corpus)
                elif getattr(gensim_model, 'add_documents', None):
                    gensim_model.add_documents(tfidf_corpus)
                gensim_model.docs_processed = doc_count
                gensim_model.save(model_fname)
            self._gensim_model = gensim_model
        return self._gensim_model

    @property
    def similarity_matrix(self):
        if self._similarity_matrix is None:
            subcorpus = self.subcorpus
            tfidf_model = self.tfidf_model
            gensim_model = self.gensim_model
            similarity_fname = join(
                self.dirname, 'similarity_%d.model' % (self.discussion.id,))
            similarity = None
            if exists(similarity_fname):
                similarity = similarities.MatrixSimilarity.load(
                    similarity_fname)
                if similarity.index.shape[0] != tfidf_model.num_docs:
                    unlink(similarity_fname)
                    similarity = None
            if similarity is None:
                similarity = similarities.MatrixSimilarity(
                    gensim_model[tfidf_model[subcorpus]])
                similarity.save(similarity_fname)
            self._similarity_matrix = similarity
        return self._similarity_matrix

    @property
    def stemmer(self):
        if self._stemmer is None:
            stemmer = get_stemmer(self.lang)
            # side effect
            self._trans = identity
            if not isinstance(stemmer, DummyStemmer):
                stemmer = ReversibleStemmer(
                    stemmer, join(self.dirname, STEMS_FNAME))

                def trans(x):
                    return stemmer.reverse.get(x, x)
                self._trans = trans
            self._stemmer = stemmer
        return self._stemmer

    @property
    def trans(self):
        if self._trans is None:
            # use the side effect
            _ = self.stemmer
        return self._trans

    @property
    def topic_intensities(self):
        if self._topic_intensities is None:
            gensim_model = self.gensim_model
            if isinstance(gensim_model, gmodels.lsimodel.LsiModel):
                self._topic_intensities = (gensim_model.projection.s
                                           / gensim_model.projection.s[0])
            else:
                self._topic_intensities = np.ones((self.num_topics,))
        return self._topic_intensities

    def gensimvecs_to_csr(self, vecs, width, topic_intensities):
        model_matrix = lil_matrix(
            (len(vecs), width), dtype=np.float64)
        for nrow, row in enumerate(vecs):
            for ncol, val in row:
                model_matrix[nrow, ncol] = val * topic_intensities[ncol]
        return model_matrix.tocsr()

    def make_model_matrix(self, post_ids=None):
        num_topics = self.num_topics
        tfidf_model = self.tfidf_model
        gensim_model = self.gensim_model
        if not tfidf_model or not gensim_model:
            return None
        if post_ids is None:
            post_ids = self.post_ids
            subcorpus = self.subcorpus
        else:
            corpus = self.corpus
            subcorpus = corpus[post_ids]
        if len(post_ids) < 3 * self.min_samples:
            return None
        tfidf_corpus = tfidf_model[subcorpus]
        topic_intensities = self.topic_intensities
        return self.gensimvecs_to_csr(
            gensim_model[tfidf_corpus], num_topics, topic_intensities)

    @property
    def model_matrix(self):
        if self._model_matrix is None:
            self._model_matrix = self.make_model_matrix()
        return self._model_matrix

    def parse_topic(self, topic, trans=identity):
        if not topic:
            return {}
        words = topic.split(' + ')
        words = (word.split('*') for word in words)
        return dict(((' '.join((
                trans(w) for w in k.strip('"').split('_') if w)), float(v))
            for (v, k) in words))

    def calc_features(self, post_clusters):
        corpus = self.corpus
        tfidf_model = self.tfidf_model
        gensim_model = self.gensim_model
        topic_intensities = self.topic_intensities
        trans = self.trans
        all_cluster_features = []
        post_ids = self.post_ids
        for cluster in post_clusters:
            cluster_corpus = corpus[cluster]
            clusterneg_corpus = corpus[
                list(set(post_ids) - set(cluster))]

            def centroid(corpus):
                clust_lda = [gensim_model[tfidf_model[c]] for c in corpus]
                clust_lda = self.gensimvecs_to_csr(
                    clust_lda, self.num_topics, topic_intensities)
                return clust_lda.sum(0).A1 / clust_lda.shape[0]

            difference_vals = centroid(cluster_corpus) - \
                centroid(clusterneg_corpus)
            difference = difference_vals.argsort()
            extremes = defaultdict(float)
            for id in chain(difference[0:5], difference[-1:-6:-1]):
                factor = difference_vals[id]
                terms = self.parse_topic(gensim_model.print_topic(id), trans)
                for term, val in terms.iteritems():
                    extremes[term] += val * factor
            extremes = [(val, term) for (term, val) in extremes.iteritems()]
            extremes.sort()
            pos_terms = [t for (v, t) in extremes if v > 0][-1:-16:-1]
            neg_terms = [t for (v, t) in extremes if v < 0][0:15]
            all_cluster_features.append((pos_terms, neg_terms))
        return all_cluster_features

    def get_similar_posts(self, post_id=None, text=None, cutoff=0.15):
        discussion = self.discussion
        post_ids = discussion.db.query(Content.id).filter_by(
            discussion_id=discussion.id).all()
        post_ids = [x for (x,) in post_ids]
        similarity = self.similarity_matrix
        tfidf_model = self.tfidf_model
        gensim_model = self.gensim_model
        lang = self.lang
        bowizer = BOWizer(lang)
        assert post_id or text, "Please give a text or a post_id"
        if post_id:
            words = bowizer.post_to_bow(Content.get(post_id))
        else:
            words = bowizer.text_to_bow(text)
        query_vec = gensim_model[tfidf_model[words]]
        results = [(v, post_ids[n])
                   for (n, v) in enumerate(similarity[query_vec])]
        results.sort(reverse=True)
        # forget self and duplicates
        results = [x for x in results if x[0] < 0.999]
        cutoff *= results[0][0]
        results = [(post_id, score) for (score, post_id) in results
                   if score > cutoff]
        return results

    def show_similar_posts(self, post_id=None, text=None, cutoff=0.15):
        discussion = self.discussion
        similar = self.get_similar_posts(post_id, text, cutoff)
        post_ids = [x[0] for x in similar]
        posts = discussion.db.query(Content).filter(Content.id.in_(post_ids))
        posts = {post.id: post for post in posts}
        results = [(posts[post_id], score) for (post_id, score) in similar]
        return [
            dict(id=post.uri(), score=score, subject=post.subject,
                 content=post.get_body_as_text())
            for post, score in results]


class SKLearnClusteringSemanticAnalysis(SemanticAnalysisData):

    def __init__(self, discussion, num_topics=200, min_samples=4, eps=None,
                 model_cls=None, metric=None, silhouette_cutoff=0.05,
                 algorithm="DBSCAN", user_id=None, test_code=None,
                 **algo_kwargs):
        super(SKLearnClusteringSemanticAnalysis, self).__init__(
            discussion, num_topics, min_samples, eps, model_cls, metric,
            user_id, test_code)
        self.silhouette_cutoff = silhouette_cutoff
        self.algorithm = algorithm
        self.eps = eps
        self.algo_kwargs = algo_kwargs

    def compare_with_children(
            self, idea_id, post_ids, post_clusters, remainder, labels):
        # Compare to children classification
        compare_with_ideas = None
        all_idea_scores = []
        ideas_of_post = defaultdict(list)
        children_remainder = set(post_ids)
        children_ids = self.idea_children[idea_id]
        if len(children_ids):
            posts_of_children = {
                child_id: self.get_posts_of_idea(child_id)
                for child_id in children_ids}
            for idea_id, c_post_ids in posts_of_children.iteritems():
                for post_id in c_post_ids:
                    ideas_of_post[post_id].append(idea_id)
                children_remainder -= set(c_post_ids)
            for post_id in children_remainder:
                ideas_of_post[post_id] = [idea_id]
            # if many ideas to a post, choose one with the most ideas in same cluster.
            # A bit arbitrary but I need a single idea.
            for cluster in chain(post_clusters, (remainder,)):
                idea_score = defaultdict(int)
                all_idea_scores.append(idea_score)
                for post_id in cluster:
                    for idea_id in ideas_of_post[post_id]:
                        idea_score[idea_id] += 1
                for post_id in cluster:
                    if len(ideas_of_post[post_id]) > 1:
                        scores = [(idea_score[idea_id], idea_id)
                                  for idea_id in ideas_of_post[post_id]]
                        scores.sort(reverse=True)
                        ideas_of_post[post_id] = [score[1] for score in scores]
            # index_by_post_id = {v: k for (k, v) in post_id_by_index.iteritems()}
            idea_of_index = [ideas_of_post[post_id][0] for post_id in post_ids]
            compare_with_ideas = {
                "Homogeneity": metrics.homogeneity_score(idea_of_index, labels),
                "Completeness": metrics.completeness_score(idea_of_index, labels),
                "V-measure": metrics.v_measure_score(idea_of_index, labels),
                "Adjusted Rand Index": metrics.adjusted_rand_score(
                    idea_of_index, labels),
                "Adjusted Mutual Information": metrics.adjusted_mutual_info_score(
                    idea_of_index, labels)}
        else:
            for post_id in children_remainder:
                ideas_of_post[post_id] = [idea_id]
            for cluster in chain(post_clusters, (remainder,)):
                all_idea_scores.append({idea_id: len(cluster)})
        return (compare_with_ideas, all_idea_scores, ideas_of_post,
                children_remainder)

    def get_cluster_info(self, idea_id=None):
        silhouette_cutoff = self.silhouette_cutoff
        algorithm = self.algorithm
        algo_kwargs = self.algo_kwargs
        metric = self.metric
        discussion = self.discussion
        eps = self.eps
        if idea_id:
            # TODO: Orphans
            post_ids = self.get_posts_of_idea(idea_id)
        else:
            post_ids = self.post_ids
        if len(post_ids) < 10:
            return

        model_matrix = self.make_model_matrix(post_ids)
        if model_matrix is None:
            return
        post_id_by_index = {n: post_id for (n, post_id) in enumerate(post_ids)}
        index_by_post_id = {post_id: n for (n, post_id) in enumerate(post_ids)}
        if not eps:
            # This is silly, but approximate eps with optics
            o = Optics(self.min_samples, metric)
            o.calculate_distances(model_matrix.todense())
            RD = o.RD
            print "optics result:", RD
            a, b = min(RD[1:]), max(RD)
            eps = a + (b - a) * 0.5
            print "epsilon", eps
            self.eps = eps
        algorithm = getattr(sklearn.cluster, algorithm)
        algorithm = algorithm(
            metric=metric, eps=eps,
            algorithm=('brute' if metric == 'cosine' else 'auto'),
            **algo_kwargs)
        r = algorithm.fit(model_matrix)
        labels = r.labels_
        n_clusters_raw = len(set(labels))
        # n_clusters_ = n_clusters_raw - (1 if -1 in labels else 0)
        silhouette_score = None
        if n_clusters_raw > 1:
            silhouette_score = metrics.silhouette_score(
                model_matrix, labels, metric=metric)
        if silhouette_score < silhouette_cutoff:
            return None
        post_clusters = []
        remainder = set(post_ids)
        for label in set(labels):
            if label == -1:
                continue
            subset = [n for (n, l) in enumerate(labels) if label == l]
            cluster = [post_id_by_index[n] for n in subset]
            remainder -= set(cluster)
            post_clusters.append(cluster)
        remainder = list(remainder)
        all_cluster_features = self.calc_features(post_clusters)
        if idea_id:
            # Compare to children classification
            (
                compare_with_ideas, all_idea_scores, ideas_of_post,
                children_remainder
            ) = self.compare_with_children(
                idea_id, post_ids, post_clusters, remainder, labels)
        else:
            compare_with_ideas = ()
            ideas_of_post = defaultdict(tuple)
            all_idea_scores = defaultdict(dict)
        post_text = self.post_texts
        post_info = {
            post_id:
            dict(ideas=ideas_of_post[post_id],
                 cluster_id=labels[index_by_post_id[post_id]])
            for post_id in post_ids
        }
        clusters = [
            dict(cluster=cluster,
                 features=all_cluster_features[n],
                 idea_scores=all_idea_scores[n])
            for (n, cluster) in enumerate(post_clusters)
        ]
        clusters.append(dict(
            cluster=remainder, idea_scores=all_idea_scores[-1]))
        return (silhouette_score, compare_with_ideas, clusters, post_info)

    def get_all_results(self):
        discussion = self.discussion
        idea_ids = discussion.db.query(Idea.id).filter_by(
            discussion_id=discussion.id).all()
        results = {id: self.get_cluster_info(id)
                   for (id,) in idea_ids}
        results[None] = self.get_cluster_info()
        posres = {id: r for (id, r) in results.iteritems() if r is not None}
        # for id, (silhouette_score, compare_with_ideas, clusters, post_info) in posres.iteritems():
        #     print id, silhouette_score, [len(x['cluster']) for x in clusters]
        return posres

    def as_html(self, f=None):
        discussion = self.discussion
        if not f:
            f = open('output.html', 'w')
        results = self.get_all_results()
        results = [(
            silhouette_score, idea_id, compare_with_ideas, clusters, post_info)
            for idea_id, (silhouette_score, compare_with_ideas, clusters, post_info)
            in results.iteritems()]
        results.sort(reverse=True)
        f.write("<html><body>")
        for (silhouette_score, idea_id, compare_with_ideas, clusters, post_info
             ) in results:
            if idea_id:
                idea = self.ideas[idea_id]
                f.write("<h1>Idea %d: [%f] %s</h1>\n" % (
                    idea_id, silhouette_score or 0,
                    (idea.short_title or '').encode('utf-8')))
            else:
                f.write("<h1>Discussion %s</h1>" %
                        discussion.topic.encode('utf-8'))
            if len(clusters) > 1:
                f.write("<p><b>Cluster size: %s</b>, remainder %d</p>\n" % (
                    ', '.join((str(len(ci['cluster'])) for ci in clusters[:-1])),
                    len(clusters[-1]['cluster'])))
            if (compare_with_ideas):
                f.write("<dl>\n")
                for k, v in compare_with_ideas.iteritems():
                    f.write("<dt>%s</dt><dd>%s</dd>\n" % (k, v))
                f.write("</dl>\n")
            children_ids = set(chain(*(
                cli['idea_scores'].keys() for cli in clusters)))
            post_counts_per_idea = {
                child_id: len([post_id for (post_id, pinfo)
                               in post_info.iteritems()
                               if child_id in pinfo['ideas']])
                for child_id in children_ids}
            for n, cluster_info in enumerate(clusters):
                is_remainder = 'features' not in cluster_info
                cluster = cluster_info['cluster']
                features = cluster_info.get('features', {})
                idea_scores = cluster_info['idea_scores']
                if is_remainder:
                    f.write("<h3 id='remainder'>Remainder:</h3>\n<ol>")
                else:
                    f.write("<h3 id='cluster_%d'>Cluster %d</h3>\n" % (n,n))
                for idea_id, score in idea_scores.iteritems():
                    idea = self.ideas[idea_id]
                    f.write("<li>Idea %d: %d/%d %s</li>\n" % (
                        idea_id, score, post_counts_per_idea[idea_id],
                        (idea.short_title or '').encode('utf-8')))
                f.write("</ol>\n")
                if features:
                    f.write("<p><b>Positive:</b> %s</p>\n" % (
                        u", ".join(features[0])).encode('utf-8'))
                    f.write("<p><b>Negative:</b> %s</p>\n" % (
                        u", ".join(features[1])).encode('utf-8'))
                f.write("<dl>\n")
                for post_id in cluster:
                    f.write("<dt><a target='out' href='%(url)sposts/local:Content/%(post_id)d'>Post %(post_id)d</a> (%(ideas)s):</dt>\n" % dict(
                        url=self.discussion_url,
                        post_id=post_id, 
                        ideas=','.join((
                            str(p) for p in post_info[post_id]['ideas']))))
                    f.write("<dd>%s</dd>" % (
                        self.post_texts[post_id].encode('utf-8')))
                f.write("</dl>\n")
        f.write("</body></html>")
        return f


class OpticsSemanticsAnalysis(SemanticAnalysisData):
    _optics = None
    _optics_clusters = None
    _optics_dendrogram = None
    _distance_matrix = None
    _post_clusters_by_cluster = None
    _cluster_features = None
    _clusters = None
    _silhouette_score = None
    _remainder = None

    def __init__(self, discussion, num_topics=200, min_samples=4, eps=None,
                 model_cls=None, metric=None, user_id=None, test_code=None):
        super(OpticsSemanticsAnalysis, self).__init__(
            discussion, num_topics, min_samples, eps=eps or 0.02,
            model_cls=model_cls, metric=metric or 'cosine',
            user_id=user_id, test_code=test_code)

    def get_cluster_idea_data(self, root_idea, post_clusters):

        def data_for_idea(idea, post_ids):
            if isinstance(idea, RootIdea):
                title = idea.discussion.topic
                cluster_count = len(post_ids)
                local_post_ids = post_ids
            else:
                title = (idea.short_title or '').encode('utf-8')
                local_post_ids = [
                    pid for pid in post_ids
                    if idea.id in self.get_ideas_of_post(pid)]
                cluster_count = len(local_post_ids)
            if not cluster_count:
                return None
            children_ids = {child.id for child in idea.children}
            if children_ids:
                only_here = len([
                    pid for pid in local_post_ids
                    if not set(self.get_ideas_of_post(pid)).intersection(children_ids)])
            else:
                only_here = cluster_count
            children_data = filter(None, [
                data_for_idea(child, post_ids) for child in idea.children])
            if isinstance(idea, RootIdea):
                orphan_cluster_count = len([
                    pid for pid in post_ids
                    if not self.get_ideas_of_post(pid)])
                if orphan_cluster_count:
                    children_data.append(dict(
                        id=-1,
                        title='orphans',
                        count=idea.num_orphan_posts,
                        only_here=orphan_cluster_count,
                        cluster_count=orphan_cluster_count))
            return dict(
                id=idea.id,
                title=title,
                count=len(self.get_posts_of_idea(idea.id)),
                cluster_count=cluster_count,
                only_here=only_here,
                children=children_data)

        return [data_for_idea(root_idea, cl)
                for cl in post_clusters]

    def alerts_in_idea_data(self, idea_data, tolerance=1, root=True):
        # TODO: Reimplement the homogeneity score for posts
        # which can be in many ideas at once.
        cluster_count = idea_data["cluster_count"]
        found_full = False
        results = []
        for child in idea_data.get("children", ()):
            results.extend(self.alerts_in_idea_data(child, tolerance, False))
            if cluster_count - child["cluster_count"] <= tolerance:
                found_full = True
        if found_full:
            return results
        if (cluster_count > tolerance and not root and
                (idea_data["count"] - cluster_count > tolerance)):
            return (idea_data["id"],)
        return results

    @property
    def optics(self):
        if self._optics is None:
            self._optics = Optics(self.min_samples, self.metric)
        return self._optics

    @property
    def distance_matrix(self):
        if self._distance_matrix is None:
            self._distance_matrix = pairwise_distances(
                self.model_matrix, metric=self.metric)
        return self._distance_matrix

    @property
    def optics_clusters(self):
        if self._optics_clusters is None:
            optics = self.optics
            self._optics_clusters = optics.extract_clusters(
                self.model_matrix.todense(), self.eps, D=self.distance_matrix)
            self._optics_clusters.sort(key=optics.cluster_depth)
        return self._optics_clusters

    def scramble_lists(self, good_list, bad_list, include_all_good=False):
        scrambled = []
        n = - len(self.scrambler)
        while good_list and bad_list:
            l = good_list if self.scrambler.next_bool() else bad_list
            scrambled.append(l.pop(0))
        n += len(self.scrambler)
        if include_all_good:
            scrambled.extend(good_list)
            self.scrambler.add_true_values(len(good_list))
        return scrambled, n

    @property
    def clusters(self):
        if self._clusters is None:
            if self.scrambler is None:
                self._clusters = self.optics_clusters
            else:
                # Revert the RD, so we get anti-clusters
                optics = self.optics
                real_clusters = self.optics_clusters[:]
                temp = optics.RDO
                optics.RDO = 1 - optics.RDO
                anti_clusters = optics.extract_clusters(eps=self.eps*5)
                anti_clusters.sort(key=optics.cluster_depth)
                # all real clusters must be present
                self._clusters, _ = self.scramble_lists(
                    real_clusters, anti_clusters, True)
                optics.RDO = temp
        return self._clusters

    @property
    def silhouette_score(self):
        if self._silhouette_score is None:
            self._silhouette_score = metrics.silhouette_score(
                self.model_matrix,
                self.optics.as_labels(self.optics_clusters),
                metric=self.metric)
        return self._silhouette_score

    @property
    def optics_dendrogram(self):
        if self._optics_dendrogram is None:
            optics = self.optics
            # TODO: dendrogram may fail due to anticluster mix
            clusters = self.clusters
            self._optics_dendrogram = optics.as_dendrogram(clusters)
        return self._optics_dendrogram

    @property
    def post_clusters_by_cluster(self):
        if self._post_clusters_by_cluster is None:
            clusters = self.clusters
            post_ids = self.post_ids
            post_ancestry = self.post_ancestry
            post_clusters_by_cluster = {
                cluster: list(post_ids[self.optics.cluster_as_ids(cluster)])
                for cluster in clusters}
            for cl_post_ids in post_clusters_by_cluster.values():
                cl_post_ids.sort(key=lambda pid: post_ancestry[pid])
            self._post_clusters_by_cluster = post_clusters_by_cluster
        return self._post_clusters_by_cluster

    @property
    def remainder(self):
        if self._remainder is None:
            post_clusters_by_cluster = self.post_clusters_by_cluster
            remainder = set(self.post_ids)
            for cluster in self.optics_dendrogram.subclusters:
                if cluster in post_clusters_by_cluster:
                    # pseudo-clusters do not work so well
                    remainder -= set(post_clusters_by_cluster[cluster.cluster])
            remainder = list(remainder)
            post_ancestry = self.post_ancestry
            remainder.sort(key=lambda pid: post_ancestry[pid])
            remainder = np.array(remainder)
            self._remainder = remainder
        return self._remainder

    @property
    def cluster_features(self):
        if self._cluster_features is None:
            post_clusters_by_cluster = self.post_clusters_by_cluster
            clusters = self.clusters
            post_clusters = [post_clusters_by_cluster[cl] for cl in clusters]
            cluster_features = self.calc_features(post_clusters)
            self._cluster_features = dict(zip(clusters, cluster_features))
        return self._cluster_features

    def get_cluster_info(self):
        model_matrix = self.model_matrix
        if model_matrix is None:
            return None
        post_ids = self.post_ids
        clusters = self.clusters
        if not clusters:
            return (-1, (), [], {})
        dendrogram = self.optics_dendrogram
        post_clusters_by_cluster = self.post_clusters_by_cluster
        remainder = self.remainder
        cluster_of_post = {}
        for post_id in post_ids:
            in_d = dendrogram.containing(np.searchsorted(post_ids, post_id))
            cluster_id = clusters.index(in_d.cluster) if in_d.parent else -1
            cluster_of_post[post_id] = cluster_id
        clusters = [
            dict(cluster=cluster,
                 pcluster=post_clusters_by_cluster[cluster])
            for (n, cluster) in enumerate(clusters)
        ]
        clusters.append(dict(pcluster=remainder, cluster=None))
        return (clusters, cluster_of_post)

    def write_title(self, f):
        discussion = self.discussion
        f.write("<h1>Discussion %s</h1>" % discussion.topic.encode('utf-8'))

    def as_html(self, f=None):
        if not f:
            f = open('output.html', 'w')
        f.write("<html><body>")
        self.write_title(f)
        self.write_cluster_info(f)
        f.write("</body></html>")
        return f

    def write_cluster_info(self, f):
        clusters = self.clusters
        post_clusters_by_cluster = self.post_clusters_by_cluster
        post_clusters = [post_clusters_by_cluster[cl] for cl in clusters]
        idea_info = self.get_cluster_idea_data(
            self.discussion.root_idea, post_clusters)
        (cluster_infos, cluster_of_post) = self.get_cluster_info()
        dendrogram = self.optics_dendrogram
        if not len(cluster_infos) > 1:
            return
        score_string = ''
        if not self.test_code:
            score_string = " (score = %f)" % (self.silhouette_score,)
        f.write("<h2>Clusters%s</h2>" % (score_string,))
        clusters = [ci['cluster'] for ci in cluster_infos]
        f.write("<p><b>Cluster size: %s</b>, remainder %d</p>\n" % (
            ', '.join((str(len(ci['cluster']))
                       for ci in cluster_infos[:-1])),
            len(cluster_infos[-1]['pcluster'])))
        for n, cluster_info in enumerate(cluster_infos):
            cluster = cluster_info['cluster']
            is_remainder = cluster is None
            pcluster = cluster_info['pcluster']
            if is_remainder:
                f.write("<h3>Remainder:</h3>\n")
            else:
                f.write("<h3>Cluster %d</h3>\n" % (n,))
                cl_dendrogram = dendrogram.find_cluster(cluster)
                assert cl_dendrogram
                if cl_dendrogram.parent != dendrogram:
                    f.write("<p>included in <a href='#cluster_%(parent)d'>cluster %(parent)d</a></p>" % dict(
                        parent=clusters.index(cl_dendrogram.parent.cluster),))
                f.write("<ul>")
                alerts = set(self.alerts_in_idea_data(idea_info[n]))

                def write_idea_info(idea_info):
                    f.write("<li>")
                    if idea_info['id'] in alerts:
                        f.write("<b>")
                    if idea_info['cluster_count'] > idea_info['only_here']:
                        f.write("{id}: <i>{only_here}</i>/<b>{cluster_count}</b>/{count} "
                                .format(**idea_info))
                    else:
                        f.write("{id}: <b>{cluster_count}</b>/{count} "
                                .format(**idea_info))
                    f.write(idea_info['title'].encode('utf-8'))
                    if idea_info['id'] in alerts:
                        f.write("</b>")
                    if idea_info.get('children', None):
                        f.write("<ul>")
                        for child in idea_info['children']:
                            write_idea_info(child)
                        f.write("</ul>")
                    f.write("</li>")
                write_idea_info(idea_info[n])
                f.write("</ul>")
            self.write_features(f, cluster)

            def title_function(post_id):
                return "<a target='out' href='%(url)sposts/local:Content/%(post_id)d'>Post %(post_id)d</a> (in ideas %(ideas)s):" % dict(
                    post_id=post_id,
                    url=self.discussion_url,
                    ideas=','.join((
                        str(p) for p in self.get_ideas_of_post(post_id))))
                # ','.join((str(p) for p in ancestry))
            self.write_post_cluster(f, pcluster, title_function)

    def write_features(self, f, cluster):
        features = self.cluster_features.get(cluster, {})
        if features:
            f.write("<p><b>Positive:</b> %s</p>\n" % (
                u", ".join(features[0])).encode('utf-8'))
            f.write("<p><b>Negative:</b> %s</p>\n" % (
                u", ".join(features[1])).encode('utf-8'))

    def write_post_cluster(self, f, pcluster, title_function):
        stack = []
        post_ancestry = self.post_ancestry
        pcluster = list(pcluster)
        pcluster.sort(key=lambda pid: post_ancestry[pid])
        for post_id in pcluster:
            ancestry = post_ancestry[post_id]
            common = min(len(ancestry), len(stack))
            while common > 0 and ancestry[common-1] != stack[common-1]:
                common -= 1
            while len(stack) > common + 1:
                f.write('</li></ul>')
                stack.pop()
            if len(ancestry) == len(stack) and len(ancestry) == common + 1:
                f.write("</li><li>")
                stack[-1] = ancestry[-1]
            else:
                if len(stack) == common+1:
                    f.write('</li></ul>')
                    stack.pop()
                while len(stack) < len(ancestry):
                    f.write('<ul><li>')
                    stack.append(ancestry[len(stack)])
            f.write("<dl>\n")
            title = title_function(post_id)
            f.write("<dt>%s</dt>\n" % (title,))
            f.write("<dd>%s</dd>" % (
                self.post_texts[post_id].encode('utf-8')))
            f.write("</dl>\n")
        while len(stack):
            f.write('</li></ul>')
            stack.pop()


def show_clusters(clusters):
    posts = self.db.query(Content).filter(
        Content.id.in_(list(chain(*clusters)))).all()
    posts = {p.id: p for p in posts}
    for n, cluster in enumerate(clusters):
        print "*"*100, "Cluster", n+1
        for post_id in cluster:
            print posts[post_id].get_body_as_text()


class OpticsSemanticsAnalysisWithSuggestions(OpticsSemanticsAnalysis):
    _silhouette_scores_per_idea = None
    _corrected_idea_sizes = None

    # next step: For each idea, compare with optics labels.
    # If intersection, compare score of
        # 1. idea
        # 2. optic cluster (vs other ideas? intersect parent?)
        # 3. idea + posts from cluster
        # 4. idea intersect post from clusters
        # 5. idea minus post from clusters

    # Compare silhoutte of idea vs silhouette of ideas with children.
    # In general have a score for good vs bad partitions of an idea.
    # Look how the optics cluster fare.
    # Also, w/o clusters, look at closest idea to the existing cluster
    # and see if adding it improves the silhouette. (Recurse)

    def is_under_idea_id(self, post_id, idea_id):
        return idea_id if idea_id in self.ideas_by_post[post_id] else None

    def is_under_sibling(self, post_id, idea_id):
        idea_hry = self.idea_hry
        if idea_id not in idea_hry:
            return
        parent_id = idea_hry[idea_id]
        if not self.is_under_idea_id(post_id, parent_id):
            return
        for child_id in self.idea_children[parent_id]:
            if child_id == idea_id:
                continue
            if self.is_under_idea_id(post_id, child_id):
                return child_id

    def is_under_ancestor(self, post_id, idea_id):
        idea_hry = self.idea_hry
        while idea_id in idea_hry:
            parent_id = idea_hry[idea_id]
            if self.is_under_idea_id(post_id, parent_id):
                return parent_id
            idea_id = parent_id

    def is_under_uncle(self, post_id, idea_id):
        idea_hry = self.idea_hry
        while idea_id in idea_hry:
            parent_id = idea_hry[idea_id]
            uncle_id = self.is_under_sibling(post_id, parent_id)
            if uncle_id:
                return uncle_id
            idea_id = parent_id

    def labels_for_idea(
            self, idea_id, include_children=False,
            include_ancestors=True, base_labels=None):
        labels = base_labels or dict()
        for post_id in self.post_ids:
            if post_id in labels:
                continue
            if self.is_under_idea_id(post_id, idea_id):
                if include_children:
                    child = None
                    for child in self.idea_children[idea_id]:
                        child = self.is_under_idea_id(post_id, child)
                        if child:
                            break
                    if child:
                        labels[post_id] = child
                        continue
                labels[post_id] = idea_id
                continue
            sibling_id = self.is_under_sibling(post_id, idea_id)
            if sibling_id:
                labels[post_id] = sibling_id
                continue
            # TODO: Try without ancestor?
            ancestor_id = self.is_under_ancestor(post_id, idea_id)
            if include_ancestors and ancestor_id:
                labels[post_id] = ancestor_id
                continue
            uncle_id = self.is_under_uncle(post_id, idea_id)
            if uncle_id:
                labels[post_id] = uncle_id
                continue
            labels[post_id] = 0
        return np.array([labels[i] for i in self.post_ids])

    def partial_silhouette_score(self, labels, post_nums):
        distances = self.distance_matrix
        A = np.array([_intra_cluster_distance(distances[i], labels, i)
                      for i in post_nums])
        B = np.array([_nearest_cluster_distance(distances[i], labels, i)
                      for i in post_nums])
        sil_samples = (B - A) / np.maximum(A, B)
        return np.mean(sil_samples)

    def silhouette_score_with_children(self, idea_id, include_ancestors=True):
        labels = self.labels_for_idea(idea_id, True, include_ancestors)
        self.remove_singletons(labels, idea_id)
        mask = np.any(list(chain(
            (labels == idea_id, ),
            (labels == x for x in self.idea_children[idea_id]))), 0)
        post_nums = mask.nonzero()[0]
        score = self.partial_silhouette_score(labels, post_nums)
        return labels, score

    def internal_silhouette(self, idea_id, base_labels=None):
        labels = self.labels_for_idea(idea_id, True, False, base_labels)
        self.remove_singletons(labels, idea_id)
        idea_post_ids = self.get_posts_of_idea(idea_id)
        if base_labels:
            idea_post_ids = set(idea_post_ids)
            idea_post_ids.update(base_labels.keys())
            idea_post_ids = np.array(list(idea_post_ids))
            idea_post_ids.sort()
        idea_post_ids = np.array(idea_post_ids)
        idea_post_nums = self.post_ids.searchsorted(idea_post_ids)
        # slicing one axis of a time
        # because simultaneous slice interpreted as diagonal
        distances = self.distance_matrix
        sub_distance = distances[idea_post_nums][:, idea_post_nums]
        sub_labels = labels[idea_post_nums]
        if len(set(sub_labels)) < 2:
            return 0
        return metrics.silhouette_score(sub_distance, sub_labels, 'precomputed')

    def remove_singletons(self, labels, idea_id):
        post_ids = self.post_ids
        for child in self.idea_children[idea_id]:
            mask = (labels == child)
            post_ids = mask.nonzero()[0]
            if len(post_ids) == 1:
                labels[post_ids[0]] = idea_id
        mask = (labels == idea_id)
        post_ids = mask.nonzero()[0]
        if len(post_ids) == 1:
            labels[post_ids[0]] = self.idea_hry.get(idea_id, 0)

    @property
    def silhouette_scores_per_idea(self):
        if self._silhouette_scores_per_idea is None:
            include_ancestors = True
            labels_by_idea = {}
            silhouette_scores_for_idea = {}
            sizes = {}
            for idea_id in self.idea_hry.keys():
                labels2 = score2 = score_internal = None
                labels = self.labels_for_idea(
                    idea_id, include_ancestors=include_ancestors)
                mask = labels == idea_id
                post_nums = mask.nonzero()[0]
                sizes[idea_id] = len(post_nums)
                if len(post_nums) > 1 and len(self.post_ids)-len(post_nums) > 1:
                    score = self.partial_silhouette_score(labels, post_nums)
                    if len(self.idea_children[idea_id]):
                        score_internal = self.internal_silhouette(idea_id)
                        labels2, score2 = self.silhouette_score_with_children(
                            idea_id, include_ancestors)
                    silhouette_scores_for_idea[idea_id] = (
                        score, score2, score_internal)
                labels_by_idea[idea_id] = (labels, labels2)
            self._silhouette_scores_per_idea = silhouette_scores_for_idea
            # Side effect
            self._corrected_idea_sizes = sizes
        return self._silhouette_scores_per_idea

    @property
    def corrected_idea_sizes(self):
        if self._corrected_idea_sizes is None:
            # use side effect
            scores = self.silhouette_scores_per_idea
        return self._corrected_idea_sizes

    def calculate_scores(self, idea_hry, include_ancestors=True):
        labels_by_idea = {}
        silhouette_scores_for_idea = {}
        sizes = {}
        for idea_id in idea_hry.keys():
            labels2 = score2 = score_internal = None
            labels = self.labels_for_idea(
                idea_id, include_ancestors=include_ancestors)
            mask = labels == idea_id
            post_nums = mask.nonzero()[0]
            sizes[idea_id] = len(post_nums)
            if len(post_nums) > 1 and len(self.post_ids)-len(post_nums) > 1:
                score = self.partial_silhouette_score(labels, post_nums)
                if len(self.idea_children[idea_id]):
                    score_internal = self.internal_silhouette(idea_id)
                    labels2, score2 = self.silhouette_score_with_children(
                        idea_id, include_ancestors)
                silhouette_scores_for_idea[idea_id] = (
                    score, score2, score_internal)
            labels_by_idea[idea_id] = (labels, labels2)
        return silhouette_scores_for_idea, sizes

    def get_suggestions(self):
        # Suggestion from Mark: Do it in layers.
        model_matrix = self.model_matrix
        post_ids = self.post_ids
        narrowest_ideas_by_post = self.narrowest_ideas_by_post
        silhouette_scores_per_idea = self.silhouette_scores_per_idea

        # TODO: Add the orphans.
        # Factor out in a function that allows an arbitrary post set
        # to be compared as a child of idea X. (And without idea Y?)

        optics = self.optics
        clusters = self.optics_clusters
        if not clusters:
            return ((), ())
        cl_labels = optics.as_labels(clusters)
        post_clusters_by_cluster = self.post_clusters_by_cluster
        suggestions_add = []
        suggestions_partition = []
        for num_cluster, cluster in enumerate(clusters):
            cl_post_ids = post_clusters_by_cluster[cluster]
            in_ideas = defaultdict(int)
            cl_score = self.partial_silhouette_score(
                 cl_labels, post_ids.searchsorted(cl_post_ids))
            # print "cluster:", cl_post_ids, cl_score

            # Looking at direct connections. Of course ancestors often
            # have more, but we lose precision. There are a few cases where
            # going up a single level would be useful, TODO.
            for post_id in cl_post_ids:
                for idea_id in narrowest_ideas_by_post[post_id]:
                    in_ideas[idea_id] += 1
            in_ideas = list(in_ideas.iteritems())
            in_ideas.sort(key=lambda x: -x[1])
            if not in_ideas:
                # TODO: Orphan cluster
                continue
            max_count = in_ideas[0][1]
            for idea_id, count in in_ideas:
                if count < 2 or count * 2 < max_count:
                    break
                idea_posts = set(self.get_posts_of_idea(idea_id))
                if len(idea_posts)-count < 2:
                    continue
                data = {post_id: idea_id for post_id in cl_post_ids}
                labels = self.labels_for_idea(idea_id, base_labels=data)

                cl_post_ids_s = set(cl_post_ids)
                intersection_posts = cl_post_ids_s.intersection(idea_posts)
                size_of_difference = len(cl_post_ids) - len(intersection_posts)
                if size_of_difference > len(idea_posts):
                    continue
                if size_of_difference > 2*len(intersection_posts):
                    continue
                new_posts = cl_post_ids_s - idea_posts
                basic_info = dict(
                        cluster_posts=', '.join(
                            (str(id) for id in cl_post_ids)),
                        cl_post_ids=cl_post_ids,
                        cl_score=cl_score,
                        count=count,
                        idea_id=idea_id,
                        num_cluster=num_cluster,
                        num_posts_cluster=len(cl_post_ids),
                        num_posts_idea=len(self.get_posts_of_idea(idea_id)),
                    )
                if cl_post_ids_s - idea_posts:
                    # If we add this whole cluster to the idea, does it
                    # yield a better partial score?
                    union_posts = cl_post_ids_s
                    union_posts.update(self.get_posts_of_idea(idea_id))
                    score = self.partial_silhouette_score(
                        labels, post_ids.searchsorted(list(union_posts)))
                    original_score = silhouette_scores_per_idea[idea_id][0]
                    suggestions_add.append(dict(
                        basic_info,
                        new_posts=new_posts,
                        num_union_posts=len(union_posts),
                        original_score=original_score,
                        score=score,
                        score_delta=original_score-score))
                # if we set the cluster as a child of this idea,
                # does it help the score?
                data = {post_id: -1 for post_id in intersection_posts}
                score = self.internal_silhouette(idea_id, data)
                original_score = silhouette_scores_per_idea[idea_id][2] or 0
                suggestions_partition.append(dict(
                        basic_info,
                        num_intersection_posts=len(intersection_posts),
                        original_score=original_score,
                        score=score,
                        score_delta=original_score-score,
                        whole=''))
                # if we set the whole cluster as a child of this idea,
                # does it help the score?
                data = {post_id: -1 for post_id in cl_post_ids}
                score = self.internal_silhouette(idea_id, data)
                suggestions_partition.append(dict(
                        basic_info,
                        new_posts=new_posts,
                        num_intersection_posts=len(intersection_posts),
                        original_score=original_score,
                        score=score,
                        score_delta=original_score-score,
                        whole='whole'))

        return (suggestions_add, suggestions_partition)

    @property
    def clusters(self):
        if self._clusters is None:
            # Do not scramble at the cluster level
            temp = self.scrambler
            self.scrambler = None
            self._clusters = super(
                OpticsSemanticsAnalysisWithSuggestions, self).clusters
            self.scrambler = temp
        return self._clusters

    def pick_best_suggestions(self, suggestion_list, group_key, reverse=False):
        polarity = -1 if reverse else 1
        suggestion_list.sort(
            key=lambda x: (x[group_key], polarity * x['score_delta']))
        suggestions = []
        for sugg_type, suggestions_of_cl in groupby(
                suggestion_list, key=lambda x: x[group_key]):
            for suggestion in suggestions_of_cl:
                suggestions.append(suggestion)
                break
        suggestions.sort(key=lambda x: polarity * x['score_delta'])
        suggestions = filter(
            lambda x: polarity * x['score_delta'] < 0, suggestions)
        return suggestions

    def select_suggestions(self, add_suggestions, partition_suggestions):
        # Choose best per cluster for additions
        best_add_suggestions = self.pick_best_suggestions(
            add_suggestions, 'num_cluster')
        # Choose best per idea for partitions
        best_partition_suggestions = self.pick_best_suggestions(
            partition_suggestions, 'idea_id')
        if self.scrambler is not None:
            worst_add_suggestions = self.pick_best_suggestions(
                add_suggestions, 'num_cluster', True)
            best_add_suggestions, c1 = self.scramble_lists(
                best_add_suggestions, worst_add_suggestions, True)
            worst_partition_suggestions = self.pick_best_suggestions(
                partition_suggestions, 'idea_id', True)
            best_partition_suggestions, c2 = self.scramble_lists(
                best_partition_suggestions, worst_partition_suggestions, True)
            self.scramble_count = (c1, c2)
        return (best_add_suggestions, best_partition_suggestions)

    def print_idea_scores(self):
        discussion = self.discussion
        silhouette_scores_per_idea = self.silhouette_scores_per_idea
        sizes = self.corrected_idea_sizes
        idea_children = self.idea_children
        ideas = self.ideas

        def print_idea(id, depth=0):
            print "  " * depth, id, sizes.get(id, 0),\
                silhouette_scores_per_idea.get(id, None), (
                    ideas[id].short_title or '').encode('utf-8')
            for child in idea_children.get(id, ()):
                print_idea(child, depth+1)

        root = discussion.root_idea.id
        print_idea(root)

    def idea_scores_as_html(self, idea_id, f):
        idea = self.ideas[idea_id]
        size = self.corrected_idea_sizes.get(idea_id, 0)
        children = self.idea_children.get(idea_id, ())
        if size < 2 and not children:
            return
        inner_score, _, outer_score = self.silhouette_scores_per_idea.get(
            idea_id, (None, None, None))
        if not isinstance(idea, RootIdea):
            if outer_score is None:
                f.write("<li>%d (%f) (%d posts) %s" % (
                    idea_id, inner_score or 0,
                    size, (idea.short_title or '').encode('utf-8')))
            else:
                f.write("<li>%d (%f ; %f) (%d posts) %s" % (
                    idea_id, inner_score or 0, outer_score,
                    size, (idea.short_title or '').encode('utf-8')))
        if children:
            f.write("<ul>")
            for child_id in children:
                self.idea_scores_as_html(child_id, f)
            f.write("</ul>")
        f.write("</li>")

    def as_html(self, f=None):
        # TODO: Rewrite as jinja.
        if not f:
            f = open('output.html', 'w')
        f.write("<html><body>")
        if self.test_code:
            f.write('''<form action="test_results" method="POST">
            <input type="hidden" name="test_code" value="%(test_code)s">
            <input type="hidden" name="user_id" value="%(user_id)s">
            <input type="hidden" name="server" value="%(server)s">
            <input type="hidden" name="discussion" value="%(disc_id)d">''' %
            dict(test_code=self.test_code, disc_id=self.discussion.id,
                 user_id=self.user_id, server=get_config()['public_hostname']))
        self.write_title(f)
        discussion = self.discussion
        root = discussion.root_idea.id
        f.write('<ul>')
        self.idea_scores_as_html(root, f)
        f.write('</ul>')
        self.suggestions_as_html(f)
        # self.write_cluster_info(f)

        if self.test_code:
            f.write('''<input type="hidden" name="scramble_count"
                value="%d,%d">''' % self.scramble_count)
            # f.write('''<input type="scrambled" name="scrambled"
            #     value="%s">''' % self.scrambler)
            f.write('<input type="submit"></input>')
            f.write('</form>')
        f.write("</body></html>")
        return f

    def suggestions_as_html(self, f):
        (suggestions_add, suggestions_partition) = self.get_suggestions()
        (suggestions_add, suggestions_partition) = self.select_suggestions(
            suggestions_add, suggestions_partition)
        if suggestions_add:
            f.write("<h2>Suggested additions</h2>")
            for n, suggestion in enumerate(suggestions_add):
                idea_id = suggestion['idea_id']
                new_posts = suggestion['new_posts']
                cluster_id = suggestion['num_cluster']
                idea = self.ideas[idea_id]
                suggestion['title'] = (idea.short_title or '').encode('utf-8')
                # children_ids = self.idea_children[idea_id]
                cluster = self.clusters[cluster_id]
                cluster_posts = self.post_clusters_by_cluster[cluster]
                suggestion['num_new_posts'] = len(new_posts)
                suggestion['url'] = self.discussion_url
                union = set(self.get_posts_of_idea(idea_id))
                union.update(new_posts)
                f.write("""<h3>From cluster %(num_cluster)d (size: %(num_posts_cluster)d)</h3>
                    <p>Add %(num_new_posts)d posts to <a target='out' href='%(url)sidea/local:Idea/%(idea_id)d'>idea %(idea_id)d</a> <b>%(title)s</b><br />
                    Already in cluster: %(count)d / %(num_posts_idea)d.""" % suggestion)
                if not self.test_code:
                    f.write(" Outer score: %(original_score)f -> %(score)f" % suggestion)
                f.write("</p>")
                self.write_features(f, cluster)
                if self.test_code:
                    f.write('''<p>Is this suggestion useful?
                        <input type="radio" name="add_%(num)d_valid" value="true">yes</input>
                        <input type="radio" name="add_%(num)d_valid" value="false">no</input></p>'''
                        % dict(num=n))

                def title_function(post_id):
                    if post_id in new_posts:
                        return "<b>Add new <a target='out' href='%(url)sposts/local:Content/%(post_id)d'>post %(post_id)d</a></b>:" % dict(
                            url=self.discussion_url, post_id=post_id)
                    elif post_id in cluster_posts:
                        return "<a target='out' href='%(url)sposts/local:Content/%(post_id)d'>Post %(post_id)d</a> (<em>already in cluster</em>):" % dict(
                            url=self.discussion_url, post_id=post_id)
                    else:
                        return "<a target='out' href='%(url)sposts/local:Content/%(post_id)d'>Post %(post_id)d</a> (<em><b>not</b> in cluster</em>):" % dict(
                            url=self.discussion_url, post_id=post_id)
                self.write_post_cluster(f, union, title_function)
        if suggestions_partition:
            f.write("<h2>Suggested segmentations</h2>")
            for n, suggestion in enumerate(suggestions_partition):
                idea_id = suggestion['idea_id']
                new_posts = suggestion.get('new_posts', ())
                cluster_id = suggestion['num_cluster']
                ideas_by_post = self.ideas_by_post
                idea = self.ideas[idea_id]
                suggestion['title'] = (idea.short_title or '').encode('utf-8')
                suggestion['url'] = self.discussion_url
                children_ids = self.idea_children[idea_id]
                cluster = self.clusters[cluster_id]
                cluster_posts = self.post_clusters_by_cluster[cluster]
                if new_posts:
                    target = set(self.get_posts_of_idea(idea_id))
                    target.update(new_posts)
                    suggestion['num_new_posts'] = len(new_posts)
                    f.write("""<h3>Segment and complete <a target='out' href='%(url)sidea/local:Idea/%(idea_id)d'>idea %(idea_id)d</a> with cluster %(num_cluster)d (size: %(num_posts_cluster)d), adding %(num_new_posts)d posts)</h3>
                    <p>""" % suggestion)
                else:
                    target = self.get_posts_of_idea(idea_id)
                    f.write("""<h3>Segment <a target='out' href='%(url)sidea/local:Idea/%(idea_id)d'>idea %(idea_id)d</a> using cluster %(num_cluster)d (in idea: <b>%(count)d</b> / %(num_posts_cluster)d)</h3>
                    <p>""" % suggestion)
                if not self.test_code:
                    f.write("inner score: %(original_score)f -> %(score)f. " % suggestion)
                f.write(" Idea: <b>%(title)s</b></p>" % suggestion)
                self.write_features(f, cluster)
                if self.test_code:
                    f.write('''<p>Is this suggestion useful?
                        <input type="radio" name="part_%(num)d_valid" value="true">yes</input>
                        <input type="radio" name="part_%(num)d_valid" value="false">no</input></p>'''
                        % dict(num=n))

                def title_function(post_id):
                    present_in = set(ideas_by_post[post_id])
                    present_in = present_in.intersection(set(children_ids))
                    args = dict(url=self.discussion_url, post_id=post_id,
                                present_in=', '.join((
                                    str(x) for x in present_in)))
                    if post_id in new_posts:
                        return "<b>Add new <a target='out' href='%(url)sposts/local:Content/%(post_id)d'>post %(post_id)d</a></b>:" % args
                    elif post_id in cluster_posts:
                        if present_in:
                            return "<a target='out' href='%(url)sposts/local:Content/%(post_id)d'>Post %(post_id)d</a> (<b>put in new idea</b>, <em>formerly in %(present_in)s</em>):" % args
                        else:
                            return "<a target='out' href='%(url)sposts/local:Content/%(post_id)d'>Post %(post_id)d</a> (<b>put in new idea</b></em>):" % args
                    else:
                        if present_in:
                            return "<a target='out' href='%(url)sposts/local:Content/%(post_id)d'>Post %(post_id)d</a> (<em><b>not</b> in cluster</em>, keep in %(present_in)s):" % args
                        else:
                            return "<a target='out' href='%(url)sposts/local:Content/%(post_id)d'>Post %(post_id)d</a> (<em><b>not</b> in cluster</em>):" % args
                self.write_post_cluster(f, target, title_function)

    def print_suggestions(self):
        (suggestions_add, suggestions_partition) = self.get_suggestions()

        if suggestions_add:
            print "Additions:"
            for suggestion in suggestions_add:
                suggestion['new_posts'] = ','.join((
                    str(x) for x in suggestion['new_posts']))
                print "cluster: %(num_cluster)d (size %(num_posts_cluster)d) idea: %(idea_id)d incluster: %(count)d / %(num_posts_idea)d, union %(num_union_posts)d, score=%(score)f > %(original_score)f, cluster=%(cl_score)f\n%(new_posts)s" % suggestion
        if suggestions_partition:
            print "Partitions:"
            for suggestion in suggestions_partition:
                if 'new_posts' in suggestion:
                    suggestion['new_posts'] = ','.join((
                        str(x) for x in suggestion['new_posts']))
                print "cluster: %(num_cluster)d (size %(num_posts_cluster)d) idea: %(idea_id)d incluster: %(count)d / %(num_posts_idea)d, score=%(score)f > %(original_score)f, cluster=%(cl_score)f\n%(cluster_posts)s" % suggestion
