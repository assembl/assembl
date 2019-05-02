# -*- coding: utf-8 -*-

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

