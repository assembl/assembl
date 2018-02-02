# -*- coding: utf-8 -*-

from assembl.graphql.schema import Schema as schema


def test_graphql_get_syntheses(graphql_request,
                               user_language_preference_en_cookie,
                               synthesis_in_syntheses):
    assert len(synthesis_in_syntheses.data['syntheses']) == 1
    synthesis = synthesis_in_syntheses.data['syntheses'][0]
    assert synthesis['subject'] is None
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
