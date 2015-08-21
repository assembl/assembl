from collections import defaultdict
from os.path import join, exists
from os import makedirs
from itertools import chain

from sqlalchemy import (text, column, bindparam)
from gensim import corpora, models
from gensim.utils import tokenize
import numpy
from scipy.sparse import lil_matrix
import sklearn.cluster
from sklearn import metrics


from assembl.models import Content, Idea, Discussion
from .indexedcorpus import IdMmCorpus
from . import (
    locale_to_lang, get_stop_words, known_languages, get_stemmer,
    DummyStemmer, ReversibleStemmer)

nlp_data = 'var/nlp'


def as_word_list(post, stemmer, stop_words):
    text = (post.subject or "") + " " + post.get_body_as_text()
    return [stemmer.stemWord(word)
            for word in tokenize(text, True)
            if word not in stop_words]


def create_dictionaries():
    db = Discussion.default_db
    by_main_lang = defaultdict(list)
    for d in db.query(Discussion).all():
        main_lang = d.discussion_locales[0].split('_')[0]
        by_main_lang[main_lang].append(d.id)
    for lang, discussion_ids in by_main_lang.iteritems():
        dirname = join(nlp_data, lang)
        if not exists(dirname):
            makedirs(dirname)
        stemmer = get_stemmer(lang)
        if not isinstance(stemmer, DummyStemmer):
            stemmer = ReversibleStemmer(
                stemmer, join(dirname, 'stems.dict'))
        stop_words = get_stop_words(lang)
        posts = db.query(Content).join(Discussion).filter(
            Discussion.id.in_(discussion_ids))

        dictionary = corpora.Dictionary((
            as_word_list(post, stemmer, stop_words) for post in posts))
        dictionary.save(join(dirname, 'dico.dict'))
        IdMmCorpus.serialize(join(dirname, 'posts.mm'), (
            (post.id, dictionary.doc2bow(
                as_word_list(post, stemmer, stop_words))) for post in posts))
        if not isinstance(stemmer, DummyStemmer):
            stemmer.save()


def gensimvecs_to_csr(vecs, width):
    model_matrix = lil_matrix(
        (len(vecs), width), dtype=numpy.float64)
    for nrow, row in enumerate(vecs):
        for ncol, val in row:
            model_matrix[nrow, ncol] = val
    return model_matrix.tocsr()


def get_cluster_info(idea_id, num_topics=200, passes=5, algorithm="DBSCAN", **algo_kwargs):
    idea = Idea.get(idea_id)
    lang = idea.discussion.discussion_locales[0].split('_')[0]
    dirname = join(nlp_data, lang)
    stemmer = get_stemmer(lang)
    if not isinstance(stemmer, DummyStemmer):
        stemmer = ReversibleStemmer(
            stemmer, join(dirname, 'stems.dict'))
    dictionary = corpora.Dictionary.load(join(dirname, 'dico.dict'))
    corpus = IdMmCorpus(join(dirname, 'posts.mm'))
    related = text(
        Idea._get_related_posts_statement(),
        bindparams=[bindparam('root_idea_id', idea_id),
                    bindparam('discussion_id', idea.discussion_id)]
        ).columns(column('post_id')).alias('related')
    post_ids = idea.db.query(Content.id).join(
        related, Content.id == related.c.post_id)
    post_ids = [x for (x,) in post_ids]
    post_id_by_index = {n: post_id for (n, post_id) in enumerate(post_ids)}
    subcorpus = corpus.subcorpus(post_ids)
    tfidf_model = models.TfidfModel(subcorpus)
    if tfidf_model.num_docs < 10:
        return None
    tfidf_corpus = tfidf_model[subcorpus]
    lda_model = models.ldamodel.LdaModel(
        tfidf_corpus, id2word=dictionary, num_topics=num_topics, passes=passes)
    model_matrix = gensimvecs_to_csr(lda_model[tfidf_corpus], num_topics)
    algorithm = getattr(sklearn.cluster, algorithm)
    algorithm = algorithm(**algo_kwargs)
    r = algorithm.fit(model_matrix)
    labels = r.labels_
    n_clusters_ = len(set(labels)) - (1 if -1 in labels else 0)
    silhouette_score = None
    if n_clusters_ > 0:
        silhouette_score = metrics.silhouette_score(model_matrix, labels)
    post_clusters = []
    for label in set(labels):
        if label == -1:
            continue
        subset = [n for (n, l) in enumerate(labels) if label == l]
        post_clusters.append([post_id_by_index[n] for n in subset])
    all_cluster_features = []
    for cluster in post_clusters:
        cluster_corpus = corpus.subcorpus(cluster)
        clusterneg_corpus = corpus.subcorpus(
            list(set(post_ids) - set(cluster)))

        def centroid(corpus):
            clust_lda = [lda_model[tfidf_model[c]] for c in corpus]
            clust_lda = gensimvecs_to_csr(clust_lda, num_topics)
            return clust_lda.sum(0).A1 / clust_lda.shape[0]

        difference = centroid(cluster_corpus) - centroid(clusterneg_corpus)
        difference = difference.argsort()
        def as_words(index):
            words = tokenize(index)
            if getattr(stemmer, 'reverse', None):
                return [stemmer.reverse[word] for word in words]
            return list(words)
        clusterneg_features = [
            as_words(lda_model.print_topic(id))
            for id in difference[0:4]]
        cluster_features = [
            as_words(lda_model.print_topic(id))
            for id in difference[-1:-5:-1]]
        all_cluster_features.append((cluster_features, clusterneg_features))
    return silhouette_score, post_clusters, all_cluster_features
    # On root: [[1781, 2036, 2069, 2090, 2100]]
    # on 429: posts=[2093, 1787, 2040, 2047, 2086, 2079]


def show_clusters(clusters):
    posts = Content.default_db.query(Content).filter(
        Content.id.in_(list(chain(*clusters)))).all()
    posts = {p.id: p for p in posts}
    for n, cluster in enumerate(clusters):
        print "*"*100, "Cluster", n+1
        for post_id in cluster:
            print posts[post_id].get_body_as_text()
