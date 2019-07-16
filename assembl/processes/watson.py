"""Infrastructure to route CRUD events through Celery_, and create Notification objects.

.. _Celery: http://www.celeryproject.org/
"""
import traceback

from watson_developer_cloud import NaturalLanguageUnderstandingV1
from watson_developer_cloud.natural_language_understanding_v1 import (
    Features, CategoriesOptions, KeywordsOptions,
    ConceptsOptions, SentimentOptions, EmotionOptions
)
import transaction

from . import celery
from ..lib.model_watcher import BaseModelEventWatcher
from ..lib.utils import waiting_get
from ..lib import config
from ..lib import logging
from ..lib.sentry import capture_exception


API_ENDPOINTS = {}
api_version = config.get("watson_api_version", "2018-09-21")
log = logging.getLogger()


# From https://www.ibm.com/watson/developercloud/natural-language-understanding/api/v1/
watson_languages = {
    "categories": ["ar", "en", "fr", "de", "it", "ja", "ko", "pt", "es"],
    "concepts": ["en", "fr", "de", "ja", "ko", "es"],
    "emotion": ["en"],
    "keywords": ["en", "fr", "de", "it", "ja", "ko", "pt", "ru", "es", "sv"],
    "sentiment": ["ar", "en", "fr", "de", "it", "ja", "ko", "pt", "ru", "es"],
}

watson_feature_classes = {
    "categories": CategoriesOptions,
    "concepts": ConceptsOptions,
    "emotion": EmotionOptions,
    "keywords": KeywordsOptions,
    "sentiment": SentimentOptions,
}


def get_endpoint(api_key):
    global API_ENDPOINTS
    if api_key not in API_ENDPOINTS:
        API_ENDPOINTS[api_key] = NaturalLanguageUnderstandingV1(
            version=api_version,
            iam_apikey=api_key,
            url=config.get('watson_url', None))
    return API_ENDPOINTS[api_key]


@celery.task()
def do_watson_computation(id):
    from ..models.generic import Content
    from ..models.langstrings import Locale
    from ..models.nlp import (
        DBPediaConcept,
        PostKeywordAnalysis,
        PostLocalizedConceptAnalysis,
        PostWatsonV1SentimentAnalysis,
        Tag,
    )
    with transaction.manager:
        post = waiting_get(Content, id)
        assert post
        discussion = post.discussion
        desired_locales = set(discussion.discussion_locales)
        desired_locales.add('en')  # always translate tags to english
        translator = discussion.translation_service()
        source_locale = post.body.first_original().locale.code
        if not translator.canTranslate(source_locale, "en", True):
            log.error("Not a real translation service")
        api_key = config.get("watson_api_key")
        assert api_key
        endpoint = get_endpoint(api_key)
        for computation in post.computations:
            if computation.status != "pending":
                log.debug('skipping computation %d in state %s' % (
                    computation.id, computation.status))
            else:
                features = Features._from_dict(computation.parameters)
                try:
                    lse = post.body.first_original()
                    lang = lse.locale.code
                    log.debug('watson analyzing %d' % post.id)
                    result = endpoint.analyze(
                        html=lse.value,
                        language=lang if lang != Locale.UNDEFINED else None,
                        clean=False,
                        return_analyzed_text=True,
                        features=features)
                    if result.get_status_code() != 200:
                        computation.status = "failure"
                        computation.result = result.get_headers()
                        continue
                    else:
                        result = result.get_result()
                    log.debug('watson analyzed %d' % post.id)
                    if lang == Locale.UNDEFINED:
                        lse.locale = Locale.get_or_create(result['language'])
                    computation.result = result
                    computation.status = "success"
                    for keyword in result.get('keywords', ()):
                        tag = Tag.getOrCreateTag(
                            keyword['text'], lse.locale, post.db)
                        tag.simplistic_unify(translator)
                        post.db.add(PostKeywordAnalysis(
                            post=post, source=computation,
                            value=tag, score=keyword['relevance'],
                            occurences=keyword['count']))
                    for category in result.get('categories', ()):
                        tag = Tag.getOrCreateTag(
                            category['label'], lse.locale, post.db)
                        tag.simplistic_unify(translator)
                        post.db.add(PostKeywordAnalysis(
                            post=post, source=computation, category=True,
                            value=tag, score=category['score']))
                    for concept in result.get('concepts', ()):
                        dbconcept = DBPediaConcept.get_or_create(
                            concept['dbpedia_resource'], post.db)
                        dbconcept.identify_languages(desired_locales, post.db)
                        post.db.add(PostLocalizedConceptAnalysis(
                            post=post, source=computation,
                            value=dbconcept, score=concept['relevance']))
                    sentiments = {}
                    if result.get('emotion', None):
                        emotion = result['emotion']['document']['emotion']
                        sentiments.update(dict(
                            anger=emotion['anger'],
                            disgust=emotion['disgust'],
                            fear=emotion['fear'],
                            joy=emotion['joy'],
                            sadness=emotion['sadness'],
                        ))
                    if result.get('sentiment', None):
                        sentiments['sentiment'] = \
                            result['sentiment']['document']['score']
                    if sentiments:
                        post.db.add(PostWatsonV1SentimentAnalysis(
                            post=post,
                            source=computation,
                            text_length=len(result['analyzed_text']),
                            **sentiments
                        ))
                except Exception:
                    capture_exception()
                    computation.result = traceback.format_exc()
                    computation.status = "failure"
                    computation.retries = (computation.retries or 0) + 1


def get_or_create_computation_on_post(post, process_name, parameters):
    """Create the computation on the post for the given parameters"""
    from ..models.computation import ComputationOnPost, ComputationProcess
    for computation in post.computations:
        if (computation.process.name == process_name and
                computation.parameters == parameters):
            return computation
    process = ComputationProcess.by_name(process_name, post.db)
    computation = ComputationOnPost(
        post=post, process=process, post_id=post.id,
        parameters=parameters)
    post.db.add(computation)


def prepare_computation(id):
    """Prepare computation parameters according to discussion preferences"""
    from assembl.models import Content
    post = Content.get(id)
    active = post.discussion.preferences['with_semantic_analysis']
    if active and post.body:
        api_version = config.get("watson_api_version", "2018-03-16")
        features = {}
        post_loc = post.body.first_original().locale.root_locale
        for feature_name, langs in watson_languages.items():
            if post_loc not in langs:
                continue
            features[feature_name] = watson_feature_classes[feature_name]()
        if not features:
            return
        features = Features(**features)

        get_or_create_computation_on_post(
            post, "watson_" + api_version, features._to_dict())
        return True


def process_post_watson(id, celery=False):
    """Use this entry point to analyze a post from pshell"""
    if celery:
        from assembl.lib.sqla import is_zopish
        if is_zopish():
            do_it = prepare_computation(id)
        else:
            with transaction.manager:
                do_it = prepare_computation(id)
        if do_it:
            return do_watson_computation.delay(id)
    else:
        if prepare_computation(id):
            return do_watson_computation(id)


class ModelEventWatcherCelerySender(BaseModelEventWatcher):
    """A IModelEventWatcher that call watson for every post through Celery_"""

    def processPostCreated(self, id):
        process_post_watson(id, True)
