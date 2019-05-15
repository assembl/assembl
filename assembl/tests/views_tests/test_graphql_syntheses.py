# -*- coding: utf-8 -*-
from graphql_relay import to_global_id

from assembl.models import SynthesisPost
from assembl.graphql.schema import Schema as schema
from assembl.models.idea_graph_view import FULLTEXT_SYNTHESIS_TYPE
from assembl.tests.utils import FakeUploadedFile


def test_graphql_get_syntheses(graphql_request,
                               graphql_registry,
                               user_language_preference_en_cookie,
                               synthesis_post_1):
    res = schema.execute(
        graphql_registry['SynthesesQuery'],
        context_value=graphql_request,
        variable_values={"lang": "en"},
    )
    assert res.errors is None
    assert len(res.data['syntheses']) == 1
    synthesis = res.data['syntheses'][0]
    assert synthesis['subject'] == 'subject EN'


def test_graphql_get_synthesis(graphql_request,
                               graphql_registry,
                               user_language_preference_en_cookie,
                               synthesis_post_1):
    synthesis_post_id = to_global_id('Post', synthesis_post_1.id)
    res = schema.execute(
        graphql_registry['SynthesisQuery'],
        context_value=graphql_request,
        variable_values={"id": synthesis_post_id, "lang": "en"},
    )
    synthesis = res.data['synthesisPost']['publishesSynthesis']
    assert synthesis['subject'] == 'subject EN'
    assert len(synthesis['ideas']) == 2


def test_graphql_get_multilingual_synthesis(graphql_request, graphql_registry, fulltext_synthesis_post_with_image):
    synthesis_post_id = to_global_id('Post', fulltext_synthesis_post_with_image.id)
    res = schema.execute(
        graphql_registry['MultilingualSynthesisQuery'],
        context_value=graphql_request,
        variable_values={"id": synthesis_post_id},
    )
    assert res.errors is None
    synthesis = res.data['synthesisPost']['publishesSynthesis']
    assert len(synthesis['subjectEntries']) == 2
    assert synthesis['subjectEntries'][0]['value'] == u'a synthesis with image'


def test_graphql_has_syntheses(graphql_request,
                               user_language_preference_en_cookie,
                               synthesis_post_1):
    res = schema.execute(
        u"""query HasSynthesesQuery {
              hasSyntheses
            }
        """,
        context_value=graphql_request
    )
    assert res.data['hasSyntheses']


def test_graphql_create_synthesis(graphql_request, graphql_registry):
    subject_entries = [
        {
            "value": u"First synthesis",
            "localeCode": u"en"
        },
        {
            "value": u"Première synthèse",
            "localeCode": u"fr"
        }
    ]
    body_entries = [
        {
            "value": u"Foobar",
            "localeCode": u"en"
        },
        {
            "value": u"Lorem ipsum dolor sit amet, consectetur adipisicing elit.",
            "localeCode": u"fr"
        }
    ]

    graphql_request.POST['variables.image'] = FakeUploadedFile(
        u'path/to/img.png', 'image/png')

    res = schema.execute(
        graphql_registry['createSynthesis'],
        context_value=graphql_request,
        variable_values={
            "synthesisType": FULLTEXT_SYNTHESIS_TYPE,
            "image": u"variables.image",
            "lang": u"fr",
            "subjectEntries": subject_entries,
            "bodyEntries": body_entries,
            "publicationState": u"DRAFT"
        }
    )
    assert res.errors is None
    result = res.data
    assert result is not None
    assert result['createSynthesis'] is not None
    assert res.data['createSynthesis']['synthesisPost']['publicationState'] == u"DRAFT"
    synthesis = result['createSynthesis']['synthesisPost']['publishesSynthesis']
    assert synthesis['subjectEntries'] == subject_entries
    assert sorted(synthesis['subjectEntries'], key=lambda e: e['localeCode']) == subject_entries
    assert sorted(synthesis['bodyEntries'], key=lambda e: e['localeCode']) == body_entries
    assert synthesis['synthesisType'] == FULLTEXT_SYNTHESIS_TYPE

    assert '/documents/' in synthesis['img']['externalUrl']


def test_graphql_update_synthesis(graphql_registry, graphql_request, fulltext_synthesis_post_with_image):
    synthesis_post = fulltext_synthesis_post_with_image
    synthesis_post_graphql_id = to_global_id('Post', synthesis_post.id)
    graphql_request.POST['variables.image'] = FakeUploadedFile(
        u'path/to/new-img.png', 'image/png')
    subject_entries = [
        {
            "value": u"My synthesis v2",
            "localeCode": u"en"
        },
        {
            "value": u"Ma synthèse v2",
            "localeCode": u"fr"
        }
    ]
    body_entries = [
        {
            "value": u"Text in english v2",
            "localeCode": u"en"
        },
        {
            "value": u"Texte en français v2",
            "localeCode": u"fr"
        }
    ]
    res = schema.execute(
        graphql_registry['updateSynthesis'],
        context_value=graphql_request,
        variable_values={
            "id": synthesis_post_graphql_id,
            "image": u"variables.image",
            "embedCode": u"nothing",
            "lang": u"fr",
            "subjectEntries": subject_entries,
            "bodyEntries": body_entries,
            "publicationState": u"PUBLISHED"
        }
    )
    assert res.errors is None
    assert res.data is not None
    assert res.data['updateSynthesis'] is not None
    assert res.data['updateSynthesis']['synthesisPost']['publicationState'] == u"PUBLISHED"
    assert res.data['updateSynthesis']['synthesisPost']['publishesSynthesis'] is not None
    synthesis = res.data['updateSynthesis']['synthesisPost']['publishesSynthesis']
    assert sorted(synthesis['subjectEntries'], key=lambda e: e['localeCode']) == subject_entries
    assert sorted(synthesis['bodyEntries'], key=lambda e: e['localeCode']) == body_entries

    assert '/documents/' in synthesis['img']['externalUrl']

    new_synthesis_post = SynthesisPost.get(synthesis_post.id)
    assert new_synthesis_post.attachments[0].document.title == 'new-img.png'
    new_synthesis = new_synthesis_post.publishes_synthesis
    assert new_synthesis.body.closest_entry('en').value == u"Text in english v2"
    assert new_synthesis.body.closest_entry('fr').value == u"Texte en français v2"


def test_graphql_delete_synthesis(graphql_registry, graphql_request, fulltext_synthesis_post):
    fulltext_synthesis_post_id = to_global_id('Post', fulltext_synthesis_post.id)
    res = schema.execute(
        graphql_registry['deleteSynthesis'],
        variable_values={
            "id": fulltext_synthesis_post_id
        },
        context_value=graphql_request)
    assert res.errors is None
    assert res.data['deleteSynthesis']['success'] is True
    assert SynthesisPost.get(fulltext_synthesis_post.id) is None
