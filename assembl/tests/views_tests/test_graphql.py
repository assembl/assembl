# -*- coding: utf-8 -*-
import json

from graphql_relay.node.node import to_global_id

from assembl import models
from assembl.graphql.schema import Schema as schema


def test_get_thematics_noresult(graphql_request):
    res = schema.execute(u'query { thematics(identifier:"survey") { id, title, description, numPosts, numContributors, questions { title }, video {title, description, htmlCode} } }', context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {u'thematics': []}


def test_get_thematics_no_video(discussion, graphql_request, test_session):
    title = u"Comprendre les dynamiques et les enjeux"
    title = models.LangString.create(title, locale_code="fr")
    thematic = models.Thematic(
        discussion_id=discussion.id,
        title=title,
        identifier="survey")
    test_session.add(thematic)
    test_session.commit()
    thematic_gid = to_global_id('Thematic', thematic.id)

    res = schema.execute(u'query { thematics(identifier:"survey") { id, title, description, numPosts, numContributors, questions { title }, video {title, description, htmlCode} } }', context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {
        u'thematics': [{u'description': None,
                        u'id': thematic_gid,
                        u'numContributors': 0,
                        u'numPosts': 0,
                        u'questions': [],
                        u'title': u'Comprendre les dynamiques et les enjeux',
                        u'video': {u'description': None,
                                   u'htmlCode': None,
                                   u'title': None}}]}


def test_get_thematics_with_video(discussion, graphql_request, test_session):
    title = u"Comprendre les dynamiques et les enjeux"
    title = models.LangString.create(title, locale_code="fr")
    video_title = models.LangString.create(
        u"Laurent Alexandre, chirurgien et expert en intelligence artificielle nous livre ses prédictions pour le 21e siècle.",
        locale_code="fr")
    video_desc = models.LangString.create(
        u"Personne ne veut d'un monde où on pourrait manipuler nos cerveaux et où les états pourraient les bidouiller",
        locale_code="fr")
    thematic = models.Thematic(
        discussion_id=discussion.id,
        title=title,
        identifier="survey",
        video_title=video_title,
        video_description=video_desc,
        video_html_code=u"<object>....</object>",
    )
    test_session.add(thematic)
    test_session.commit()
    thematic_gid = to_global_id('Thematic', thematic.id)

    res = schema.execute(u'query { thematics(identifier:"survey") { id, title, description, numPosts, numContributors, questions { title }, video {title, description, htmlCode} } }', context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {
        u'thematics': [{u'description': None,
                        u'id': thematic_gid,
                        u'numContributors': 0,
                        u'numPosts': 0,
                        u'questions': [],
                        u'title': u'Comprendre les dynamiques et les enjeux',
                        u'video': {u'title': u"Laurent Alexandre, chirurgien et expert en intelligence artificielle nous livre ses prédictions pour le 21e siècle.",
                                   u'description': u"Personne ne veut d'un monde où on pourrait manipuler nos cerveaux et où les états pourraient les bidouiller",
                                   u'htmlCode': u"<object>....</object>",
                                   }}]}


def test_mutation_create_thematic_with_video(graphql_request):
    res = schema.execute(u"""
mutation myFirstMutation {
    createThematic(titleEntries:[
        {value:"Comprendre les dynamiques et les enjeux", localeCode:"fr"},
        {value:"Understanding the dynamics and issues", localeCode:"en"}
        ],
        video: {
            titleEntries:[
                {value:"Laurent Alexandre, chirurgien et expert en intelligence artificielle nous livre ses prédictions pour le 21e siècle.",
                 localeCode:"fr"},
            ]
            descriptionEntries:[
                {value:"Personne ne veut d'un monde où on pourrait manipuler nos cerveaux et où les états pourraient les bidouiller",
                 localeCode:"fr"},
            ],
            htmlCode:"<object>....</object>"
        },
        identifier:"survey") {
        thematic {
            title,
            identifier
            video {title, description, htmlCode}
        }
    }
}
""", context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {
        u'createThematic': {
            u'thematic': {
                u'title': u'Understanding the dynamics and issues',
                u'identifier': 'survey',
                u'video': {u'title': u"Laurent Alexandre, chirurgien et expert en intelligence artificielle nous livre ses prédictions pour le 21e siècle.",
                           u'description': u"Personne ne veut d'un monde où on pourrait manipuler nos cerveaux et où les états pourraient les bidouiller",
                           u'htmlCode': u"<object>....</object>",
                           }
    }}}


def test_mutation_create_thematic_multilang_implicit_en(graphql_request, user_language_preference_en_cookie):
    res = schema.execute(u"""
mutation myFirstMutation {
    createThematic(titleEntries:[
        {value:"Comprendre les dynamiques et les enjeux", localeCode:"fr"},
        {value:"Understanding the dynamics and issues", localeCode:"en"}
    ], identifier:"survey") {
        thematic {
            title,
            identifier
        }
    }
}
""", context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {
        u'createThematic': {
            u'thematic': {
                u'title': u'Understanding the dynamics and issues',
                u'identifier': u'survey'
    }}}


def test_mutation_create_thematic_multilang_implicit_fr(graphql_request, user_language_preference_fr_cookie):
    # adding en then fr on purpose, to really test that it looks at user preferences, not just the first original title
    res = schema.execute(u"""
mutation myFirstMutation {
    createThematic(titleEntries:[
        {value:"Understanding the dynamics and issues", localeCode:"en"}
        {value:"Comprendre les dynamiques et les enjeux", localeCode:"fr"},
    ], identifier:"survey") {
        thematic {
            title,
            identifier
        }
    }
}
""", context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {
        u'createThematic': {
            u'thematic': {
                u'title': u'Comprendre les dynamiques et les enjeux',
                u'identifier': u'survey'
    }}}


def test_mutation_create_thematic_multilang_explicit_fr(graphql_request):
    res = schema.execute(u"""
mutation myFirstMutation {
    createThematic(titleEntries:[
        {value:"Comprendre les dynamiques et les enjeux", localeCode:"fr"},
        {value:"Understanding the dynamics and issues", localeCode:"en"}
    ], identifier:"survey") {
        thematic {
            title(lang:"fr"),
            identifier
        }
    }
}
""", context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {
        u'createThematic': {
            u'thematic': {
                u'title': u'Comprendre les dynamiques et les enjeux',
                u'identifier': u'survey'
    }}}


def test_mutation_create_thematic_multilang_explicit_en(graphql_request):
    res = schema.execute(u"""
mutation myFirstMutation {
    createThematic(titleEntries:[
        {value:"Comprendre les dynamiques et les enjeux", localeCode:"fr"},
        {value:"Understanding the dynamics and issues", localeCode:"en"}
    ], identifier:"survey") {
        thematic {
            title(lang:"en"),
            identifier
        }
    }
}
""", context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {
        u'createThematic': {
            u'thematic': {
                u'title': u'Understanding the dynamics and issues',
                u'identifier': 'survey'
    }}}


def test_mutation_create_raise_if_no_title_entries(graphql_request):
    res = schema.execute(u"""
mutation myFirstMutation {
    createThematic(titleEntries:[], identifier:"survey") {
        thematic {
            title(lang:"en"),
            identifier
        }
    }
}
""", context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {
        u'createThematic': None
    }
    assert res.errors[0].args[0] == 'Thematic titleEntries needs at least one entry'


def test_mutation_create_thematic_no_permission(graphql_request):
    graphql_request.authenticated_userid = None
    res = schema.execute(u"""
mutation myFirstMutation {
    createThematic(titleEntries:[{value:"Comprendre les dynamiques et les enjeux", localeCode:"fr"}], identifier:"survey") {
        thematic {
            title,
            identifier
        }
    }
}
""", context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == { u'createThematic': None }


def test_mutation_create_thematic_with_questions(graphql_request):
    res = schema.execute(u"""
mutation myFirstMutation {
    createThematic(
        titleEntries:[
            {value:"Comprendre les dynamiques et les enjeux", localeCode:"fr"},
            {value:"Understanding the dynamics and issues", localeCode:"en"}
        ],
        questions:[
            {titleEntries:[
                {value:"Comment qualifiez-vous l'emergence de l'Intelligence Artificielle dans notre société ?", localeCode:"fr"}
            ]},
        ],
        identifier:"survey",
    ) {
        thematic {
            title(lang:"fr"),
            identifier
            questions { title(lang:"fr") }
        }
    }
}
""", context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {
        u'createThematic': {
            u'thematic': {
                u'title': u'Comprendre les dynamiques et les enjeux',
                u'identifier': u'survey',
                u'questions': [
                    {u'title': u"Comment qualifiez-vous l'emergence de l'Intelligence Artificielle dans notre société ?"}
                ]
    }}}


def create_thematic(graphql_request):
    res = schema.execute(u"""
mutation myFirstMutation {
    createThematic(
        titleEntries:[
            {value:"Comprendre les dynamiques et les enjeux", localeCode:"fr"},
            {value:"Understanding the dynamics and issues", localeCode:"en"}
        ],
        questions:[
            {titleEntries:[
                {value:"Comment qualifiez-vous l'emergence de l'Intelligence Artificielle dans notre société ?", localeCode:"fr"}
            ]},
        ],
        identifier:"survey",
    ) {
        thematic {
            id
            titleEntries { localeCode value },
            identifier
            questions { id, titleEntries { localeCode value } }
        }
    }
}
""", context_value=graphql_request)
    thematic_id = res.data['createThematic']['thematic']['id']
    first_question_id = res.data['createThematic']['thematic']['questions'][0]['id']
    return thematic_id, first_question_id


def test_update_thematic(graphql_request):
    thematic_id, first_question_id = create_thematic(graphql_request)
    # to test the modification, we delete the first letter of each message
    res = schema.execute(u"""
mutation secondMutation {
    updateThematic(
        id: "%s",
        titleEntries:[
            {value:"omprendre les dynamiques et les enjeux", localeCode:"fr"},
            {value:"nderstanding the dynamics and issues", localeCode:"en"}
        ],
        questions:[
            {id: "%s",
             titleEntries:[
                {value:"omment qualifiez-vous l'emergence de l'Intelligence Artificielle dans notre société ?", localeCode:"fr"}
            ]},
        ],
        identifier:"urvey",
    ) {
        thematic {
            titleEntries { localeCode value },
            identifier
            questions { titleEntries { localeCode value } }
        }
    }
}
""" % (thematic_id, first_question_id), context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {
        u'updateThematic': {
            u'thematic': {
                u'titleEntries': [
                    {u'value': u"omprendre les dynamiques et les enjeux", u'localeCode': u"fr"},
                    {u'value': u"nderstanding the dynamics and issues", u'localeCode': u"en"}
                ],
                u'identifier': u'urvey',
                u'questions': [
                    {u'titleEntries': [
                        {u'value': u"omment qualifiez-vous l'emergence de l'Intelligence Artificielle dans notre société ?", u'localeCode': u"fr"}
                    ]},
                ]
    }}}


def test_mutation_create_post(graphql_request):
    thematic_id, first_question_id = create_thematic(graphql_request)
    res = schema.execute(u"""
mutation myFirstMutation {
    createPost(
        ideaId:"%s",
        subject:"Proposition 1",
        body:"une proposition..."
    ) {
        post {
            ... on PropositionPost {
                subject,
                body,
                creator { name },
            }
        }
    }
}
""" % first_question_id, context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {
        u'createPost': {
            u'post': {
                u'subject': u'Proposition 1',
                u'body': u"une proposition...",
                u'creator': {u'name': u'Mr. Administrator'}
    }}}


def test_mutation_create_post_without_subject(graphql_request):
    thematic_id, first_question_id = create_thematic(graphql_request)
    res = schema.execute(u"""
mutation myFirstMutation {
    createPost(
        ideaId:"%s",
        body:"une proposition..."
    ) {
        post {
            ... on PropositionPost {
                subject,
                body,
                creator { name },
                mySentiment
            }
        }
    }
}
""" % first_question_id, context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {
        u'createPost': {
            u'post': {
                u'subject': u'Proposition',
                u'body': u"une proposition...",
                u'creator': {u'name': u'Mr. Administrator'},
                u'mySentiment': None
    }}}


def create_proposal(graphql_request):
    thematic_id, first_question_id = create_thematic(graphql_request)
    res = schema.execute(u"""
mutation myFirstMutation {
    createPost(
        ideaId:"%s",
        body:"une proposition..."
    ) {
        post {
            ... on PropositionPost {
                id,
                body,
                creator { name },
            }
        }
    }
}
""" % first_question_id, context_value=graphql_request)
    post_id = res.data['createPost']['post']['id']
    return post_id


def test_mutation_add_sentiment(graphql_request):
    post_id = create_proposal(graphql_request)
    res = schema.execute(u"""
mutation myFirstMutation {
    addSentiment(
        postId:"%s",
        type:LIKE
    ) {
      post {
        ... on PropositionPost {
          sentimentCounts {
            like
            disagree
          }
          mySentiment
        }
      }
    }
}
""" % post_id, context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {
        u'addSentiment': {
            u'post': {
                u'sentimentCounts': {
                   u'like': 1,
                   u'disagree': 0,
                },
                u'mySentiment': u"LIKE"
            }
        }
    }


def test_mutation_add_sentiment_like_then_disagree(graphql_request):
    post_id = create_proposal(graphql_request)
    res = schema.execute(u"""
mutation myFirstMutation {
    addSentiment(
        postId:"%s",
        type:LIKE
    ) {
    }
}
""" % post_id, context_value=graphql_request)
    res = schema.execute(u"""
mutation myFirstMutation {
    addSentiment(
        postId:"%s",
        type:DISAGREE
    ) {
      post {
        ... on PropositionPost {
          sentimentCounts {
            like
            disagree
          }
          mySentiment
        }
      }
    }
}
""" % post_id, context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {
        u'addSentiment': {
            u'post': {
                u'sentimentCounts': {
                   u'like': 0,
                   u'disagree': 1,
                },
                u'mySentiment': u"DISAGREE"
            }
        }
    }

def test_mutation_add_sentiment_like_twice(graphql_request):
    post_id = create_proposal(graphql_request)
    res = schema.execute(u"""
mutation myFirstMutation {
    addSentiment(
        postId:"%s",
        type:LIKE
    ) {
    }
}
""" % post_id, context_value=graphql_request)
    res = schema.execute(u"""
mutation myFirstMutation {
    addSentiment(
        postId:"%s",
        type:LIKE
    ) {
      post {
        ... on PropositionPost {
          sentimentCounts {
            like
            disagree
          }
          mySentiment
        }
      }
    }
}
""" % post_id, context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {
        u'addSentiment': {
            u'post': {
                u'sentimentCounts': {
                    u'like': 1,
                    u'disagree': 0,
                },
                u'mySentiment': u"LIKE"
            }
        }
    }

def test_mutation_delete_sentiment(graphql_request):
    post_id = create_proposal(graphql_request)
    res = schema.execute(u"""
mutation myFirstMutation {
    addSentiment(
        postId:"%s",
        type:LIKE
    ) {
      post {
        ... on PropositionPost {
          sentimentCounts {
            like
            disagree
          }
          mySentiment
        }
      }
    }
}
""" % post_id, context_value=graphql_request)
    res = schema.execute(u"""
mutation myFirstMutation {
    deleteSentiment(
        postId:"%s",
    ) {
      post {
        ... on PropositionPost {
          sentimentCounts {
            like
            disagree
          }
          mySentiment
        }
      }
    }
}
""" % post_id, context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {
        u'deleteSentiment': {
            u'post': {
                u'sentimentCounts': {
                    u'like': 0,
                    u'disagree': 0,
                },
                u'mySentiment': None
            }
        }
    }
