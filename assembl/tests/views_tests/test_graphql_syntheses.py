# -*- coding: utf-8 -*-
from graphql_relay import to_global_id

from assembl.models import SynthesisPost
from assembl.graphql.schema import Schema as schema
from assembl.models.idea_graph_view import FULLTEXT_SYNTHESIS_TYPE
from assembl.tests.utils import FakeUploadedFile


def test_graphql_get_syntheses(graphql_request,
                               user_language_preference_en_cookie,
                               synthesis_in_syntheses):
    assert len(synthesis_in_syntheses.data['syntheses']) == 1
    synthesis = synthesis_in_syntheses.data['syntheses'][0]
    assert synthesis['subject'] == 'subject EN'
    assert len(synthesis['ideas']) == 2


def test_graphql_get_synthesis(graphql_request,
                               user_language_preference_en_cookie,
                               synthesis_in_syntheses):
    synthesis_id = synthesis_in_syntheses.data['syntheses'][0]['id']
    res = schema.execute(
        u"""query SynthesisQuery($id: ID!, $lang: String) {
            synthesis: node(id: $id) {
              ... on Synthesis {
                id
                subject(lang: $lang)
                ideas {
                  ... on Idea {
                    id
                    live {
                      ... on Idea {
                        id
                        img { externalUrl }
                      }
                    }
                  }
                }
              }
            }
          }
        """,
        context_value=graphql_request,
        variable_values={
             "id": synthesis_id,
            "lang": "en"
        })
    assert len(res.data) == 1
    synthesis = res.data['synthesis']
    assert synthesis['subject'] == 'subject EN'
    assert len(synthesis['ideas']) == 2


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
            "value": u"Première synthèse",
            "localeCode": u"fr"
        },
        {
            "value": u"First synthesis",
            "localeCode": u"en"
        }
    ]
    body_entries = [
        {
            "value": u"Lorem ipsum dolor sit amet, consectetur adipisicing elit.",
            "localeCode": u"fr"
        },
        {
            "value": u"Foobar",
            "localeCode": u"en"
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
        }
    )
    assert res.errors is None
    result = res.data
    assert result is not None
    assert result['createSynthesis'] is not None
    synthesis = result['createSynthesis']['synthesisPost']['publishesSynthesis']
    assert synthesis['subject'] == u'Première synthèse'
    assert synthesis['body'] == u'Lorem ipsum dolor sit amet, consectetur adipisicing elit.'
    assert synthesis['synthesisType'] == FULLTEXT_SYNTHESIS_TYPE

    assert '/documents/' in synthesis['img']['externalUrl']


def test_graphql_update_synthesis(graphql_registry, graphql_request, fulltext_synthesis_post_with_image):
    synthesis_post = fulltext_synthesis_post_with_image
    synthesis_post_graphql_id = to_global_id('Post', synthesis_post.id)

    graphql_request.POST['variables.image'] = FakeUploadedFile(
        u'path/to/new-img.png', 'image/png')

    res = schema.execute(
        graphql_registry['updateSynthesis'],
        context_value=graphql_request,
        variable_values={
            "id": synthesis_post_graphql_id,
            "image": u"variables.image",
            "embedCode": u"nothing",
            "lang": u"fr",
            "subjectEntries": [
                {
                    "value": u"My synthesis v2",
                    "localeCode": u"en"
                },
                {
                    "value": u"Ma synthèse v2",
                    "localeCode": u"fr"
                }
            ],
            "bodyEntries": [
                {
                    "value": u"Text in english v2",
                    "localeCode": u"en"
                },
                {
                    "value": u"Texte en français v2",
                    "localeCode": u"fr"
                }
            ],
        }
    )
    assert res.errors is None
    assert res.data is not None
    assert res.data['updateSynthesis'] is not None
    assert res.data['updateSynthesis']['synthesisPost']['publishesSynthesis'] is not None
    synthesis = res.data['updateSynthesis']['synthesisPost']['publishesSynthesis']
    assert synthesis[u'subject'] == u'Ma synthèse v2'
    assert synthesis[u'body'] == u'Texte en français v2'

    assert '/documents/' in synthesis['img']['externalUrl']

    new_synthesis_post = SynthesisPost.get(synthesis_post.id)
    assert new_synthesis_post.attachments[0].document.title == 'new-img.png'
    new_synthesis = new_synthesis_post.publishes_synthesis
    assert new_synthesis.body.closest_entry('en').value == 'Text in english v2'
    assert new_synthesis.body.closest_entry('fr').value == 'Texte en français v2'


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
