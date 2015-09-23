from collections import defaultdict
from os.path import join, exists
from os import makedirs, unlink
from itertools import chain

from sqlalchemy import (text, column, bindparam)
from sqlalchemy.orm import defer
from gensim import corpora, models as gmodels, similarities
from gensim.utils import tokenize as gtokenize
import numpy
from scipy.sparse import lil_matrix
import sklearn.cluster
from sklearn import metrics
from .optics import Optics

from assembl.lib.config import get_config
from assembl.models import Content, Idea, Discussion
from .indexedcorpus import IdMmCorpus
from . import (
    locale_to_lang, get_stop_words, known_languages, get_stemmer,
    DummyStemmer, ReversibleStemmer)

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


def as_word_list(post, stemmer, stop_words):
    subject = post.subject or ""
    if subject.split().lower() in ('re:', 'comment'):
        subject = ''
    else:
        subject += ' '
    text = subject + post.get_body_as_text()
    return [stemmer.stemWord(word)
            for word in tokenize(text, True)
            if word not in stop_words]


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


def create_dictionaries(discussion_id=None):
    db = Discussion.default_db
    by_main_lang = defaultdict(list)
    default_locales = get_config().get('available_languages', 'fr_CA en_CA').split()
    only_for_lang = None
    for d_id, locales in db.query(
            Discussion.id, Discussion.preferred_locales).all():
        locales = locales.split() if locales else default_locales
        main_lang = locales[0].split('_')[0]
        by_main_lang[main_lang].append(d_id)
        if discussion_id == d_id:
            only_for_lang = main_lang
    for lang, discussion_ids in by_main_lang.iteritems():
        if only_for_lang and only_for_lang != lang:
            continue
        dirname = join(nlp_data, lang)
        if not exists(dirname):
            makedirs(dirname)
        corpus_fname = join(dirname, CORPUS_FNAME)
        if exists(corpus_fname):
            corpus = IdMmCorpus(corpus_fname)
            doc_count = db.query(Content).with_polymorphic(Content
                ).options(defer(Content.like_count)).join(Discussion
                ).filter(Discussion.id.in_(discussion_ids)).count()
            if corpus.num_docs == doc_count:
                if only_for_lang:
                    return corpus
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
        return IdMmCorpus(corpus_fname)


def gensimvecs_to_csr(vecs, width, topic_intensities):
    model_matrix = lil_matrix(
        (len(vecs), width), dtype=numpy.float64)
    for nrow, row in enumerate(vecs):
        for ncol, val in row:
            model_matrix[nrow, ncol] = val * topic_intensities[ncol]
    return model_matrix.tocsr()


def get_discussion_semantic_analysis(
        discussion_id, num_topics=100,
        model_cls=gmodels.lsimodel.LsiModel, **model_kwargs):
    discussion = Discussion.get(discussion_id)
    lang = discussion.discussion_locales[0].split('_')[0]
    dirname = join(nlp_data, lang)
    dict_fname = join(dirname, DICTIONARY_FNAME)
    # rebuild dico in all cases to ensure complete corpus
    corpus = create_dictionaries(discussion_id)
    dictionary = corpora.Dictionary.load(dict_fname)
    post_ids = discussion.db.query(Content.id).filter_by(
        discussion_id=discussion_id)
    doc_count = post_ids.count()
    if doc_count < 10:
        return None, None
    post_ids = [x for (x,) in post_ids]
    subcorpus = corpus[post_ids]
    tfidf_model = gmodels.TfidfModel(id2word=dictionary)
    tfidf_fname = join(dirname, "tfidf_%d.model" % (discussion_id,))
    model_fname = join(dirname, "model_%s_%d.model" % (
        model_cls.__name__, discussion_id,))
    gensim_model = model_cls(
        id2word=dictionary, num_topics=num_topics, **model_kwargs)
    if exists(tfidf_fname):
        tfidf_model = tfidf_model.load(tfidf_fname)
        # assumption: count implies identity.
        # Wrong in corner cases: hidden, etc.
        if tfidf_model.num_docs == doc_count:
            if exists(model_fname):
                gensim_model = gensim_model.load(model_fname)
                same_kwargs = all((
                    getattr(gensim_model, k) == v
                    for (k, v) in model_kwargs.iteritems()))
                same_kwargs = same_kwargs and getattr(
                    gensim_model, 'num_updates', doc_count) == doc_count
                if same_kwargs and gensim_model.num_topics == num_topics:
                    return (subcorpus, tfidf_model, gensim_model)
        elif exists(tfidf_fname):
            unlink(tfidf_fname)
    if exists(model_fname):
        unlink(model_fname)
    if tfidf_model.num_docs != doc_count:
        tfidf_model.initialize(subcorpus)
        tfidf_model.save(tfidf_fname)
    tfidf_corpus = tfidf_model[subcorpus]
    if getattr(gensim_model, 'update', None):
        gensim_model.update(tfidf_corpus)
    elif getattr(gensim_model, 'add_documents', None):
        gensim_model.add_documents(tfidf_corpus)
    gensim_model.save(model_fname)
    return (subcorpus, tfidf_model, gensim_model)


def get_similarity_matrix(
        discussion, num_topics=100, model_cls=gmodels.lsimodel.LsiModel,
        **model_kwargs):
    (
        subcorpus, tfidf_model, gensim_model
    ) = get_discussion_semantic_analysis(discussion.id)
    lang = discussion.discussion_locales[0].split('_')[0]
    dirname = join(nlp_data, lang)
    similarity_fname = join(dirname, 'similarity_%d.model' % (discussion.id,))
    if exists(similarity_fname):
        similarity = similarities.MatrixSimilarity.load(similarity_fname)
        if similarity.index.shape[0] == tfidf_model.num_docs:
            return subcorpus, tfidf_model, gensim_model, similarity
    similarity = similarities.MatrixSimilarity(
        gensim_model[tfidf_model[subcorpus]])
    similarity.save(similarity_fname)
    return subcorpus, tfidf_model, gensim_model, similarity


def get_similar_posts(discussion, post_id=None, text=None, cutoff=0.15):
    post_ids = discussion.db.query(Content.id).filter_by(discussion_id=discussion.id).all()
    post_ids = [x for (x,) in post_ids]
    (subcorpus, tfidf_model, gensim_model, similarity
        ) = get_similarity_matrix(discussion)
    lang = discussion.discussion_locales[0].split('_')[0]
    bowizer = BOWizer(lang)
    assert post_id or text, "Please give a text or a post_id"
    if post_id:
        words = bowizer.post_to_bow(Content.get(post_id))
    else:
        words = bowizer.text_to_bow(text)
    query_vec = gensim_model[tfidf_model[words]]
    results = [(v, post_ids[n]) for (n, v) in enumerate(similarity[query_vec])]
    results.sort(reverse=True)
    # forget self and duplicates
    results = [x for x in results if x[0] < 0.999]
    cutoff *= results[0][0]
    results = [(post_id, score) for (score, post_id) in results
               if score > cutoff]
    return results


def show_similar_posts(discussion, post_id=None, text=None, cutoff=0.15):
    similar = get_similar_posts(discussion, post_id, text, cutoff)
    post_ids = [x[0] for x in similar]
    posts = discussion.db.query(Content).filter(Content.id.in_(post_ids))
    posts = {post.id: post for post in posts}
    results = [(posts[post_id], score) for (post_id, score) in similar]
    return [
        dict(id=post.uri(), score=score, subject=post.subject,
             content=post.get_body_as_text())
        for post, score in results]


def identity(x):
    return x


def parse_topic(topic, trans=identity):
    if not topic:
        return {}
    words = topic.split(' + ')
    words = (word.split('*') for word in words)
    return dict(((' '.join((
            trans(w) for w in k.strip('"').split('_') if w)), float(v))
        for (v, k) in words))


def post_ids_of(idea):
    related = text(
        Idea._get_related_posts_statement(),
        bindparams=[bindparam('root_idea_id', idea.id),
                    bindparam('discussion_id', idea.discussion_id)]
        ).columns(column('post_id')).alias('related')
    post_ids = idea.db.query(Content.id).join(
        related, Content.id == related.c.post_id)
    return [x for (x,) in post_ids]


def get_cluster_info(
        discussion_id, idea_id=None, num_topics=100, passes=5,
        silhouette_cutoff=0.05, algorithm="DBSCAN", **algo_kwargs):
    metric = algo_kwargs.get('metric', 'cosine')
    if idea_id:
        idea = Idea.get(idea_id)
        discussion = idea.discussion
    else:
        idea = None
        discussion = Discussion.get(discussion_id)
    _, tfidf_model, gensim_model = get_discussion_semantic_analysis(
        discussion_id, num_topics=num_topics,  # passes=passes)
        model_cls=gmodels.lsimodel.LsiModel)
    if not tfidf_model or not gensim_model:
        return
    lang = discussion.discussion_locales[0].split('_')[0]
    dirname = join(nlp_data, lang)
    stemmer = get_stemmer(lang)
    trans = identity
    if not isinstance(stemmer, DummyStemmer):
        stemmer = ReversibleStemmer(
            stemmer, join(dirname, STEMS_FNAME))

        def trans(x):
            return stemmer.reverse.get(x, x)
    corpus = IdMmCorpus(join(dirname, CORPUS_FNAME))
    # TODO: Orphans
    if idea:
        post_ids = post_ids_of(idea)
    else:
        post_ids = [x for (x,) in discussion.db.query(
            Content.id).filter_by(discussion_id=discussion_id).all()]
    if len(post_ids) < 10:
        return
    post_id_by_index = {n: post_id for (n, post_id) in enumerate(post_ids)}
    index_by_post_id = {post_id: n for (n, post_id) in enumerate(post_ids)}
    subcorpus = corpus[post_ids]
    tfidf_corpus = tfidf_model[subcorpus]
    if isinstance(gensim_model, gmodels.lsimodel.LsiModel):
        topic_intensities = gensim_model.projection.s / gensim_model.projection.s[0]
    else:
        topic_intensities = numpy.ones((num_topics,))
    model_matrix = gensimvecs_to_csr(gensim_model[tfidf_corpus], num_topics, topic_intensities)
    if 'eps' not in algo_kwargs:
        # This is silly, but approximate eps with optics
        o = Optics(algo_kwargs.get('min_samples', 4), metric)
        o.calculate_distances(model_matrix.todense())
        RD = o.RD
        print "optics result:", RD
        a, b = min(RD[1:]), max(RD)
        eps = a + (b - a) * 0.5
        print "epsilon", eps
        algo_kwargs['eps'] = eps
    algorithm = getattr(sklearn.cluster, algorithm)
    algorithm = algorithm(
        metric=metric,
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
    all_cluster_features = calc_features(
            post_ids, post_clusters, corpus, tfidf_model,
            gensim_model, num_topics, topic_intensities, trans)
    if idea:
        # Compare to children classification
        (
            compare_with_ideas, all_idea_scores, ideas_of_post, children_remainder
        ) = compare_with_children(
            idea, post_ids, post_clusters, remainder, labels)
    else:
        compare_with_ideas = ()
        ideas_of_post = defaultdict(tuple)
        all_idea_scores = defaultdict(dict)
        children_remainder = set()
    post_text = dict(Content.default_db.query(Content.id, Content.body).all())
    post_info = {
        post_id:
        dict(ideas=ideas_of_post[post_id],
             cluster_id=labels[index_by_post_id[post_id]],
             text=post_text[post_id])
        for post_id in post_ids
    }
    clusters = [
        dict(cluster=cluster,
             features=all_cluster_features[n],
             idea_scores=all_idea_scores[n])
        for (n, cluster) in enumerate(post_clusters)
    ]
    clusters.append(dict(cluster=remainder, idea_scores=all_idea_scores[-1]))
    return (silhouette_score, compare_with_ideas, clusters, post_info)


def get_cluster_info_optics(
        discussion, num_topics=100,
        silhouette_cutoff=0.05, min_points=4, eps=0.2, metric='cosine'):
    _, tfidf_model, gensim_model = get_discussion_semantic_analysis(
        discussion.id, num_topics=num_topics,
        model_cls=gmodels.lsimodel.LsiModel)
    if not tfidf_model or not gensim_model:
        return
    lang = discussion.discussion_locales[0].split('_')[0]
    dirname = join(nlp_data, lang)
    stemmer = get_stemmer(lang)
    trans = identity
    if not isinstance(stemmer, DummyStemmer):
        stemmer = ReversibleStemmer(
            stemmer, join(dirname, STEMS_FNAME))

        def trans(x):
            return stemmer.reverse.get(x, x)
    corpus = IdMmCorpus(join(dirname, CORPUS_FNAME))
    post_ids = [x for (x,) in discussion.db.query(
        Content.id).filter_by(discussion_id=discussion.id).all()]
    if len(post_ids) < 3 * min_points:
        return
    post_ids = numpy.array(post_ids)
    post_ids.sort()
    subcorpus = corpus[post_ids]
    tfidf_corpus = tfidf_model[subcorpus]
    if isinstance(gensim_model, gmodels.lsimodel.LsiModel):
        topic_intensities = gensim_model.projection.s / gensim_model.projection.s[0]
    else:
        topic_intensities = numpy.ones((num_topics,))
    model_matrix = gensimvecs_to_csr(
        gensim_model[tfidf_corpus], num_topics, topic_intensities)
    optics = Optics(min_points, metric)
    clusters = optics.extract_clusters(model_matrix.todense(), eps)
    clusters.sort(key=optics.cluster_depth)
    dendrogram = optics.as_dendrogram(clusters)
    if not clusters:
        return (-1, (), [], {}, dendrogram)
    post_clusters_by_cluster = {
        cluster: post_ids[optics.cluster_as_ids(cluster)]
        for cluster in clusters}
    silhouette_score = metrics.silhouette_score(
        model_matrix, optics.as_labels(clusters), metric="cosine")
    remainder = set(post_ids)
    for cluster in dendrogram.subclusters:
        remainder -= set(post_clusters_by_cluster[cluster.cluster])
    remainder = list(remainder)
    post_clusters = [post_clusters_by_cluster[cl] for cl in clusters]
    all_cluster_features = calc_features(
            post_ids, post_clusters, corpus, tfidf_model,
            gensim_model, num_topics, topic_intensities, trans)
    compare_with_ideas = ()
    ideas_of_post = defaultdict(tuple)
    all_idea_scores = defaultdict(dict)
    post_text = dict(Content.default_db.query(Content.id, Content.body).all())
    post_info = {}
    for post_id in post_ids:
        in_d = dendrogram.containing(numpy.searchsorted(post_ids, post_id))
        cluster_id = clusters.index(in_d.cluster) if in_d.parent else -1
        post_info[post_id] = dict(
            ideas=ideas_of_post[post_id],
            cluster_id=cluster_id,
            text=post_text[post_id])
    clusters = [
        dict(cluster=cluster,
             pcluster=post_clusters_by_cluster[cluster],
             features=all_cluster_features[n],
             idea_scores=all_idea_scores[n])
        for (n, cluster) in enumerate(clusters)
    ]
    clusters.append(dict(pcluster=remainder, cluster=None, idea_scores=all_idea_scores[-1]))
    return (
        silhouette_score, compare_with_ideas, clusters, post_info, dendrogram)


def calc_features(post_ids, post_clusters, corpus, tfidf_model, gensim_model, num_topics, topic_intensities, trans):
    all_cluster_features = []
    for cluster in post_clusters:
        cluster_corpus = corpus[cluster]
        clusterneg_corpus = corpus[
            list(set(post_ids) - set(cluster))]

        def centroid(corpus):
            clust_lda = [gensim_model[tfidf_model[c]] for c in corpus]
            clust_lda = gensimvecs_to_csr(
                clust_lda, num_topics, topic_intensities)
            return clust_lda.sum(0).A1 / clust_lda.shape[0]

        difference_vals = centroid(cluster_corpus) - \
            centroid(clusterneg_corpus)
        difference = difference_vals.argsort()
        extremes = defaultdict(float)
        for id in chain(difference[0:5], difference[-1:-6:-1]):
            factor = difference_vals[id]
            terms = parse_topic(gensim_model.print_topic(id), trans)
            for term, val in terms.iteritems():
                extremes[term] += val * factor
        extremes = [(val, term) for (term, val) in extremes.iteritems()]
        extremes.sort()
        pos_terms = [t for (v, t) in extremes if v > 0][0:15]
        neg_terms = [t for (v, t) in extremes if v < 0][0:15]
        pos_terms.reverse()
        all_cluster_features.append((pos_terms, neg_terms))
    return all_cluster_features


def compare_with_children(idea, post_ids, post_clusters, remainder, labels):
    # Compare to children classification
    compare_with_ideas = None
    all_idea_scores = []
    ideas_of_post = defaultdict(list)
    children_remainder = set(post_ids)
    if len(idea.children):
        posts_of_children = {
            child.id: post_ids_of(child)
            for child in idea.children}
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
            ideas_of_post[post_id] = [idea.id]
        for cluster in chain(post_clusters, (remainder,)):
            all_idea_scores.append({idea.id: len(cluster)})
    return (compare_with_ideas, all_idea_scores, ideas_of_post, children_remainder)


def show_clusters(clusters):
    posts = Content.default_db.query(Content).filter(
        Content.id.in_(list(chain(*clusters)))).all()
    posts = {p.id: p for p in posts}
    for n, cluster in enumerate(clusters):
        print "*"*100, "Cluster", n+1
        for post_id in cluster:
            print posts[post_id].get_body_as_text()


def get_all_results(discussion, min_samples=4):
    idea_ids = discussion.db.query(Idea.id).filter_by(
        discussion_id=discussion.id).all()
    results = {id: get_cluster_info(discussion.id, id, min_samples=min_samples)
               for (id,) in idea_ids}
    results[None] = get_cluster_info(discussion.id, min_samples=min_samples)
    posres = {id: r for (id, r) in results.iteritems() if r is not None}
    # for id, (silhouette_score, compare_with_ideas, clusters, post_info) in posres.iteritems():
    #     print id, silhouette_score, [len(x['cluster']) for x in clusters]
    return posres


def as_html(discussion, f=None, min_samples=4):
    if not f:
        f = open('output.html', 'w')
    results = get_all_results(discussion, min_samples=min_samples)
    results = [(silhouette_score, idea_id, compare_with_ideas, clusters, post_info)
        for idea_id, (silhouette_score, compare_with_ideas, clusters, post_info) in results.iteritems()]
    results.sort(reverse=True)
    f.write("<html><body>")
    for (silhouette_score, idea_id, compare_with_ideas, clusters, post_info) in results:
        if idea_id:
            idea = Idea.get(idea_id)
            f.write("<h1>Idea %d: [%f] %s</h1>\n" % (
                idea_id, silhouette_score or 0,
                (idea.short_title or '').encode('utf-8')))
        else:
            f.write("<h1>Discussion %s</h1>" % discussion.topic.encode('utf-8'))
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
                f.write("<h2>Remainder:</h2>\n<ol>")
            else:
                f.write("<h2>Cluster %d</h2>\n<ol>" % (n,))
            for idea_id, score in idea_scores.iteritems():
                idea = Idea.get(idea_id)
                f.write("<li>Idea %d: %d/%d %s</li>\n" % (
                    idea_id, score, post_counts_per_idea[idea_id],
                    (idea.short_title or '').encode('utf-8')))
            f.write("</ol>\n")
            if features:
                f.write("<p><b>Positive:</b> %s</p>\n" % (u", ".join(features[0])).encode('utf-8'))
                f.write("<p><b>Negative:</b> %s</p>\n" % (u", ".join(features[1])).encode('utf-8'))
            f.write("<dl>\n")
            for post_id in cluster:
                f.write("<dt>Post %d (%s):</dt>\n" % (post_id, ','.join((str(p) for p in post_info[post_id]['ideas']))))
                f.write("<dd>%s</dd>" % (post_info[post_id]['text'].encode('utf-8')))
            f.write("</dl>\n")
    f.write("</body></html>")
    return f


def as_html_optics(discussion, f=None, min_samples=4, eps=0.2):
    if not f:
        f = open('output.html', 'w')
    (silhouette_score, compare_with_ideas, cluster_infos, post_info, dendrogram
     ) = get_cluster_info_optics(
        discussion, min_points=min_samples, eps=eps)
    clusters = [ci['cluster'] for ci in cluster_infos]
    f.write("<html><body>")
    f.write("<h1>Discussion %s</h1>" % discussion.topic.encode('utf-8'))
    if len(cluster_infos) > 1:
        f.write("<p><b>Cluster size: %s</b>, remainder %d</p>\n" % (
            ', '.join((str(len(ci['cluster'])) for ci in cluster_infos[:-1])),
            len(cluster_infos[-1]['pcluster'])))
    for n, cluster_info in enumerate(cluster_infos):
        cluster = cluster_info['cluster']
        is_remainder = cluster is None
        pcluster = cluster_info['pcluster']
        features = cluster_info.get('features', {})
        if is_remainder:
            f.write("<h2>Remainder:</h2>\n<ol>")
        else:
            f.write("<h2>Cluster %d</h2>\n<ol>" % (n,))
        if not is_remainder:
            cl_dendrogram = dendrogram.find_cluster(cluster)
            assert cl_dendrogram
            if cl_dendrogram.parent != dendrogram:
                f.write("<p>included in %d</p>" % (
                    clusters.index(cl_dendrogram.parent.cluster),))
        f.write("</ol>\n")
        if features:
            f.write("<p><b>Positive:</b> %s</p>\n" % (u", ".join(features[0])).encode('utf-8'))
            f.write("<p><b>Negative:</b> %s</p>\n" % (u", ".join(features[1])).encode('utf-8'))
        f.write("<dl>\n")
        for post_id in pcluster:
            f.write("<dt>Post %d (%s):</dt>\n" % (post_id, ','.join((str(p) for p in post_info[post_id]['ideas']))))
            f.write("<dd>%s</dd>" % (post_info[post_id]['text'].encode('utf-8')))
        f.write("</dl>\n")
    f.write("</body></html>")
    return f
