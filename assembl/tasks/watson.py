"""Infrastructure to route CRUD events through Celery_, and create Notification objects.

.. _Celery: http://www.celeryproject.org/
"""
from watson_developer_cloud import NaturalLanguageUnderstandingV1
from watson_developer_cloud.natural_language_understanding_v1 import (
    Features, CategoriesOptions, KeywordsOptions,
    ConceptsOptions, SentimentOptions, EmotionOptions
)

from . import celery
from ..lib.model_watcher import BaseModelEventWatcher
from ..lib.utils import waiting_get
from ..lib import config

API_ENDPOINTS = {}
api_version = config.get("watson_api_version", "2018-03-16")


def get_endpoint(api_key):
    global API_ENDPOINTS
    if api_key not in API_ENDPOINTS:
        API_ENDPOINTS[api_key] = NaturalLanguageUnderstandingV1(
            version=api_version,
            iam_api_key=api_key,
            url=config.get('watson_url', None))
    return API_ENDPOINTS[api_key]


@celery.task()
def process_post_created_task(id):
    from ..models.generic import Content
    from ..models.langstrings import Locale
    from ..models.nlp import (
        DBPediaConcept,
        PostKeywordAnalysis,
        PostDBPediaConceptAnalysis,
        PostWatsonV1SentimentAnalysis,
        Tag,
    )

    post = waiting_get(Content, id)
    assert post
    api_key = config.get("watson_api_key")
    assert api_key
    endpoint = get_endpoint(api_key)
    for computation in post.computations:
        if computation.status == "pending":
            features = Features._from_dict(computation.parameters)
            try:
                desired_locales = post.discussion.preferences['preferred_locales']
                lse = post.body.first_original()
                lang = lse.locale.code
                result = endpoint.analyze(
                    html=lse.value,
                    language=lang if lang != Locale.UNDEFINED else None,
                    clean=False,
                    return_analyzed_text=True,
                    features=features)
                if lang == Locale.UNDEFINED:
                    lse.locale = Locale.get_or_create(result['language'])
                computation.result = result
                computation.status = "success"
                for keyword in result['keywords']:
                    tag = Tag.getOrCreateTag(
                        keyword['text'], lse.locale, post.db)
                    post.db.add(PostKeywordAnalysis(
                        post=post, source=computation,
                        tag=tag, score=keyword['relevance']))
                for category in result['categories']:
                    tag = Tag.getOrCreateTag(
                        category['label'], lse.locale, post.db)
                    post.db.add(PostKeywordAnalysis(
                        post=post, source=computation, category=True,
                        tag=tag, score=category['score']))
                for concept in result['concepts']:
                    dbconcept = DBPediaConcept.get_or_create(
                        concept['dbpedia_resource'], post.db)
                    dbconcept.identify_languages(desired_locales, post.db)
                    post.db.add(PostDBPediaConceptAnalysis(
                        post=post, source=computation,
                        value=dbconcept, score=keyword['relevance']))
                emotion = result['emotion']['document']['emotion']
                post.db.add(PostWatsonV1SentimentAnalysis(
                    post=post,
                    source=computation,
                    text_length=len(result['analyzed_text']),
                    sentiment=result['sentiment']['document']['score'],
                    anger=emotion['anger'],
                    disgust=emotion['disgust'],
                    fear=emotion['fear'],
                    joy=emotion['joy'],
                    sadness=emotion['sadness'],
                ))
            except Exception as e:
                computation.result = str(e)
                computation.status = "failure"
                computation.retries = (computation.retries or 0) + 1


def get_or_create_computation_on_post(post, process_name, features):
    from ..models.computation import ComputationOnPost, ComputationProcess
    for computation in post.computations:
        if (computation.process.name == process_name and
                computation.features == features):
            return computation
    process = ComputationProcess.by_name(process_name, post.db)
    computation = ComputationOnPost(
        post=post, process=process,
        parameters=features)
    post.db.add(computation)
    return computation


class ModelEventWatcherCelerySender(BaseModelEventWatcher):
    """A IModelEventWatcher that will receive CRUD events and send postCreated through Celery_"""

    def processPostCreated(self, id):
        from assembl.models import Content
        post = Content.get(id)
        active = post.discussion.preferences['use_watson']
        if active:
            api_version = config.get("watson_api_version", "2018-03-16")
            # TODO: make this configurable
            features = Features(
                categories=CategoriesOptions(),
                concepts=ConceptsOptions(),
                sentiment=SentimentOptions(),
                emotion=EmotionOptions(),
                keywords=KeywordsOptions())  # sentiment=True, emotion=True

            get_or_create_computation_on_post(
                post, "watson_" + api_version, features._to_dict())
            process_post_created_task.delay(id)
