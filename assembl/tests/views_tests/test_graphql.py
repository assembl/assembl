# -*- coding: utf-8 -*-
import json
import pytest
from graphql_relay.node.node import to_global_id

from assembl import models
from assembl.graphql.schema import Schema as schema
from assembl.graphql.schema import create_root_thematic


def test_get_locales(graphql_request):
    res = schema.execute(u'query { locales(lang:"fr") { localeCode, label } }', context_value=graphql_request)
    assert len(res.data['locales']) == 104
    assert res.data['locales'][-1]['localeCode'] == u'zu'
    assert res.data['locales'][-1]['label'] == u'zoulou'


def test_get_thematics_noresult(graphql_request):
    res = schema.execute(u'query { thematics(identifier:"survey") { id, title, description, numPosts, numContributors, questions { title }, video {title, descriptionTop, descriptionBottom, htmlCode} } }', context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {u'thematics': []}


def test_get_thematics_no_video(discussion, graphql_request, test_session):
    title = u"Comprendre les dynamiques et les enjeux"
    title = models.LangString.create(title, locale_code="fr")
    root_thematic = create_root_thematic(discussion, "survey")
    thematic = models.Thematic(
        discussion_id=discussion.id,
        title=title,
        identifier="survey")
    test_session.add(
        models.IdeaLink(source=root_thematic, target=thematic, order=1.0))
    test_session.commit()
    thematic_gid = to_global_id('Thematic', thematic.id)

    res = schema.execute(u'query { thematics(identifier:"survey") { id, title, description, numPosts, numContributors, questions { title }, video {title, descriptionTop, descriptionBottom, descriptionSide, htmlCode} } }', context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {
        u'thematics': [{u'description': None,
                        u'id': thematic_gid,
                        u'numContributors': 0,
                        u'numPosts': 0,
                        u'questions': [],
                        u'title': u'Comprendre les dynamiques et les enjeux',
                        u'video': None}]}


def test_get_thematics_with_video(discussion, graphql_request, test_session):
    title = u"Comprendre les dynamiques et les enjeux"
    title = models.LangString.create(title, locale_code="fr")
    video_title = models.LangString.create(
        u"Laurent Alexandre, chirurgien et expert en intelligence artificielle nous livre ses prédictions pour le 21e siècle.",
        locale_code="fr")
    video_desc_top = models.LangString.create(
        u"Personne ne veut d'un monde où on pourrait manipuler nos cerveaux et où les états pourraient les bidouiller",
        locale_code="fr")
    video_desc_bottom = models.LangString.create(
        u"Calise de tabarnak",
        locale_code="fr")
    video_desc_side = models.LangString.create(
        u"Putain",
        locale_code="fr")
    root_thematic = create_root_thematic(discussion, "survey")
    thematic = models.Thematic(
        discussion_id=discussion.id,
        title=title,
        identifier="survey",
        video_title=video_title,
        video_description_top=video_desc_top,
        video_description_bottom=video_desc_bottom,
        video_description_side=video_desc_side,
        video_html_code=u"<object>....</object>",
    )
    test_session.add(
        models.IdeaLink(source=root_thematic, target=thematic, order=1.0))
    test_session.commit()
    thematic_gid = to_global_id('Thematic', thematic.id)

    res = schema.execute(u'query { thematics(identifier:"survey") { id, title, description, numPosts, numContributors, questions { title }, video {title, descriptionTop, descriptionBottom, descriptionSide, htmlCode} } }', context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {
        u'thematics': [{u'description': None,
                        u'id': thematic_gid,
                        u'numContributors': 0,
                        u'numPosts': 0,
                        u'questions': [],
                        u'title': u'Comprendre les dynamiques et les enjeux',
                        u'video': {u'title': u"Laurent Alexandre, chirurgien et expert en intelligence artificielle nous livre ses prédictions pour le 21e siècle.",
                                   u'descriptionTop': u"Personne ne veut d'un monde où on pourrait manipuler nos cerveaux et où les états pourraient les bidouiller",
                                   u'descriptionBottom': u"Calise de tabarnak",
                                   u'descriptionSide': u"Putain",
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
            descriptionEntriesTop:[
                {value:"Personne ne veut d'un monde où on pourrait manipuler nos cerveaux et où les états pourraient les bidouiller",
                 localeCode:"fr"},
            ],
            descriptionEntriesBottom:[
                {value:"Calise de tabarnak",
                 localeCode:"fr"},
            ],
            descriptionEntriesSide:[
                {value:"Putain",
                 localeCode:"fr"},
            ],
            htmlCode:"<object>....</object>"
        },
        identifier:"survey") {
        thematic {
            title,
            identifier
            video {
                title,
                titleEntries {
                    localeCode,
                    value
                },
            descriptionTop,
            descriptionBottom,
            descriptionSide,
            descriptionEntriesTop {
                localeCode,
                value
            },
            descriptionEntriesBottom {
                localeCode,
                value
            }
            descriptionEntriesSide {
                localeCode,
                value
            }
            htmlCode}
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
                           u'titleEntries': [{
                               u'value': u"Laurent Alexandre, chirurgien et expert en intelligence artificielle nous livre ses prédictions pour le 21e siècle.",
                               u'localeCode': u"fr"
                           }],
                           u'descriptionTop': u"Personne ne veut d'un monde où on pourrait manipuler nos cerveaux et où les états pourraient les bidouiller",
                           u'descriptionBottom': u"Calise de tabarnak",
                           u'descriptionSide': u"Putain",
                           u'descriptionEntriesTop': [{
                               u'value': u"Personne ne veut d'un monde où on pourrait manipuler nos cerveaux et où les états pourraient les bidouiller",
                               u'localeCode': u"fr"
                           }],
                           u'descriptionEntriesBottom': [{
                               u'value': u"Calise de tabarnak",
                               u'localeCode': u"fr"
                           }],
                           u'descriptionEntriesSide': [{
                               u'value': u"Putain",
                               u'localeCode': u"fr"
                           }],
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


def test_mutation_create_thematic_multilang_explicit_fr_fallback_to_en(graphql_request, user_language_preference_fr_cookie):
    # If we ask for French but don't have this translation, instead of returning null, fallback to english
    res = schema.execute(u"""
mutation myFirstMutation {
    createThematic(titleEntries:[
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
                u'title': u'Understanding the dynamics and issues',
                u'identifier': u'survey'
    }}}

def test_mutation_create_thematic_multilang_explicit_fr_fallback_to_en_with_italian_cookie(graphql_request, user_language_preference_it_cookie):
    # If we ask for French but don't have this translation, instead of returning null, fallback to english
    res = schema.execute(u"""
mutation myFirstMutation {
    createThematic(titleEntries:[
        {value:"Understanding the dynamics and issues", localeCode:"en"}
        {value:"Italian...", localeCode:"it"}
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
                u'title': u'Understanding the dynamics and issues',
                u'identifier': u'survey'
    }}}



def test_mutation_create_thematic_upload_file(graphql_request):
    # create thematic
    import os
    from io import BytesIO

    class FieldStorage(object):
        file = BytesIO(os.urandom(16))
        filename = u'path/to/img.png'
        type = 'image/png'

    graphql_request.POST['variables.img'] = FieldStorage()
    res = schema.execute(u"""
mutation myFirstMutation($img:String) {
    createThematic(titleEntries:[
        {value:"Comprendre les dynamiques et les enjeux", localeCode:"fr"},
        {value:"Understanding the dynamics and issues", localeCode:"en"}
    ],
        identifier:"survey",
        image:$img
    ) {
        thematic {
            id,
            title(lang:"fr"),
            identifier,
            img {
                externalUrl
                mimeType
            }
        }
    }
}
""", context_value=graphql_request, variable_values={"img": u"variables.img"})
    # The test doesn't use the same discussion id (sometimes it's 1, sometimes 8)
    # depending on which tests are executed...
    # py.test assembl -k test_mutation_create_thematic_upload_file
    # returns http://localhost:6543/data/Discussion/1/documents/1/data
    # py.test assembl -k test_graphql
    # returns http://localhost:6543/data/Discussion/8/documents/1/data
#    assert json.loads(json.dumps(res.data)) == {
#        u'createThematic': {
#            u'thematic': {
#                u'title': u'Comprendre les dynamiques et les enjeux',
#                u'identifier': u'survey',
#                u'imgUrl': u'http://localhost:6543/data/Discussion/8/documents/1/data'
#    }}}
#    just assert we have the ends correct:
    assert '/documents/' in res.data['createThematic']['thematic']['img']['externalUrl']
    assert res.data['createThematic']['thematic']['img']['mimeType'] == 'image/png'
    thematic_id = res.data['createThematic']['thematic']['id']

    # and update it to change the image

    class FieldStorage(object):
        file = BytesIO(os.urandom(16))
        filename = u'path/to/img2.png'
        type = 'image/png'

    graphql_request.POST['variables.img'] = FieldStorage()
    res = schema.execute(u"""
mutation myFirstMutation($img:String, $thematicId:ID!) {
    updateThematic(
        id:$thematicId,
        titleEntries:[
            {value:"Comprendre les dynamiques et les enjeux", localeCode:"fr"},
            {value:"Understanding the dynamics and issues", localeCode:"en"}
        ],
        identifier:"survey",
        image:$img
    ) {
        thematic {
            title(lang:"fr"),
            identifier,
            img {
                externalUrl
                mimeType
            }
        }
    }
}
""", context_value=graphql_request, variable_values={"thematicId": thematic_id,
                                                     "img": u"variables.img"})
    assert '/documents/' in res.data['updateThematic']['thematic']['img']['externalUrl']
    assert res.data['updateThematic']['thematic']['img']['mimeType'] == 'image/png'


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
            {titleEntries:[
                {value:"Seconde question ?", localeCode:"fr"}
            ]},
            {titleEntries:[
                {value:"Troisième question ?", localeCode:"fr"}
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
                    {u'title': u"Comment qualifiez-vous l'emergence de l'Intelligence Artificielle dans notre société ?"},
                    {u'title': u"Seconde question ?"},
                    {u'title': u"Troisième question ?"}
                ]
    }}}


def test_delete_thematic(graphql_request, thematic_and_question):
    thematic_id, first_question_id = thematic_and_question
    res = schema.execute(u"""
mutation myFirstMutation {
    deleteThematic(
        thematicId:"%s",
    ) {
        success
    }
}
""" % thematic_id, context_value=graphql_request)
    assert True == res.data['deleteThematic']['success']
    res = schema.execute(u'query { thematics(identifier:"survey") { id, title, description, numPosts, numContributors, questions { title }, video {title, descriptionTop, descriptionBottom, htmlCode} } }', context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {u'thematics': []}


def test_get_thematic_via_node_query(graphql_request, thematic_and_question):
    thematic_id, first_question_id = thematic_and_question
    res = schema.execute(u"""query {
        node(id:"%s") {
            __typename,
            ... on Thematic {
                title
            }
        }
    }""" % thematic_id, context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {
            u'node': {u"__typename": u"Thematic",
                      u"title": u"Understanding the dynamics and issues"}}


def test_get_question_via_node_query(graphql_request, thematic_and_question):
    thematic_id, first_question_id = thematic_and_question
    res = schema.execute(u"""query {
        node(id:"%s") {
            __typename,
            ... on Question {
                title
            }
        }
    }""" % first_question_id, context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {
            u'node': {u"__typename": u"Question",
                      u"title": u"Comment qualifiez-vous l'emergence de l'Intelligence Artificielle dans notre société ?"}}


def test_get_proposition_post_via_node_query(graphql_request, proposition_id):
    res = schema.execute(u"""query {
        node(id:"%s") {
            __typename,
            ... on Post {
                body
            }
        }
    }""" % proposition_id, context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {
            u'node': {u"__typename": u"Post",
                      u"body": u"une proposition..."}}


def test_update_thematic(graphql_request, thematic_and_question):
    thematic_id, first_question_id = thematic_and_question
    # to test the modification, we delete the first letter of each message
    res = schema.execute(u"""
mutation secondMutation {
    updateThematic(
        id: "%s",
        titleEntries:[
            {value:"nderstanding the dynamics and issues", localeCode:"en"},
            {value:"omprendre les dynamiques et les enjeux", localeCode:"fr"}
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
                    {u'value': u"nderstanding the dynamics and issues", u'localeCode': u"en"},
                    {u'value': u"omprendre les dynamiques et les enjeux", u'localeCode': u"fr"}
                ],
                u'identifier': u'urvey',
                u'questions': [
                    {u'titleEntries': [
                        {u'value': u"omment qualifiez-vous l'emergence de l'Intelligence Artificielle dans notre société ?", u'localeCode': u"fr"}
                    ]},
                ]
    }}}


def test_update_thematic_delete_question(graphql_request, thematic_and_question):
    thematic_id, first_question_id = thematic_and_question
    res = schema.execute(u"""
mutation secondMutation {
    updateThematic(
        id: "%s",
        titleEntries:[
            {value:"Understanding the dynamics and issues", localeCode:"en"},
            {value:"Comprendre les dynamiques et les enjeux", localeCode:"fr"}
        ],
        questions:[
        ],
        identifier:"survey",
    ) {
        thematic {
            titleEntries { localeCode value },
            identifier
            questions { titleEntries { localeCode value } }
        }
    }
}
""" % (thematic_id), context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {
        u'updateThematic': {
            u'thematic': {
                u'titleEntries': [
                    {u'value': u"Understanding the dynamics and issues", u'localeCode': u"en"},
                    {u'value': u"Comprendre les dynamiques et les enjeux", u'localeCode': u"fr"}
                ],
                u'identifier': u'survey',
                u'questions': [
                ]
    }}}


def test_update_thematic_delete_video(graphql_request, thematic_with_video_and_question):
    thematic_id, first_question_id = thematic_with_video_and_question
    res = schema.execute(u"""
mutation myMutation($thematicId:ID!) {
    updateThematic(
        id:$thematicId,
        titleEntries:[
            {value:"Understanding the dynamics and issues", localeCode:"en"},
            {value:"Comprendre les dynamiques et les enjeux", localeCode:"fr"}
        ],
        video:{},
        identifier:"survey",
    ) {
        thematic {
            titleEntries { localeCode value },
            identifier
            questions { titleEntries { localeCode value } }
            video {
                titleEntries {
                    localeCode,
                    value
            },
            descriptionEntriesTop {
                localeCode,
                value
            },
            descriptionEntriesBottom {
                localeCode,
                value
            },
            descriptionEntriesSide {
                localeCode,
                value
            },
            title,
            descriptionTop,
            descriptionBottom,
            descriptionSide,
            htmlCode }
        }
    }
}
""", context_value=graphql_request, variable_values={"thematicId": thematic_id})
    assert json.loads(json.dumps(res.data)) == {
        u'updateThematic': {
            u'thematic': {
                u'titleEntries': [
                    {u'value': u"Understanding the dynamics and issues", u'localeCode': u"en"},
                    {u'value': u"Comprendre les dynamiques et les enjeux", u'localeCode': u"fr"}
                ],
                u'identifier': u'survey',
                u'questions': [
                    {u'titleEntries': [
                        {u'value': u"Comment qualifiez-vous l'emergence de l'Intelligence Artificielle dans notre société ?", u'localeCode': u"fr"}
                    ]},
                ],
                u'video': None
    }}}


def test_update_thematic_add_question(graphql_request, thematic_and_question):
    # This test add a new question and change the questions order
    thematic_id, first_question_id = thematic_and_question
    res = schema.execute(u"""
mutation secondMutation {
    updateThematic(
        id: "%s",
        titleEntries:[
            {value:"Understanding the dynamics and issues", localeCode:"en"},
            {value:"Comprendre les dynamiques et les enjeux", localeCode:"fr"}
        ],
        questions:[
            {titleEntries:[
                {value:"Seconde question mais en premier !", localeCode:"fr"}
            ]},
            {id: "%s",
             titleEntries:[
                {value:"Comment qualifiez-vous l'emergence de l'Intelligence Artificielle dans notre société ?", localeCode:"fr"}
            ]},
        ],
        identifier:"survey",
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
                    {u'value': u"Understanding the dynamics and issues", u'localeCode': u"en"},
                    {u'value': u"Comprendre les dynamiques et les enjeux", u'localeCode': u"fr"}
                ],
                u'identifier': u'survey',
                u'questions': [
                    {u'titleEntries': [
                        {u'value': u"Seconde question mais en premier !", u'localeCode': u"fr"}
                    ]},
                    {u'titleEntries': [
                        {u'value': u"Comment qualifiez-vous l'emergence de l'Intelligence Artificielle dans notre société ?", u'localeCode': u"fr"}
                    ]},
                ]
    }}}


def test_mutation_create_post(graphql_request, thematic_and_question):
    thematic_id, first_question_id = thematic_and_question
    res = schema.execute(u"""
mutation myFirstMutation {
    createPost(
        ideaId:"%s",
        subject:"Proposition 1",
        body:"une proposition..."
    ) {
        post {
            ... on Post {
                subject,
                body,
                bodyEntries { localeCode value },
                creator { name },
                bodyMimeType
                publicationState
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
                u'bodyEntries': [{u'value': u"une proposition...", u'localeCode': u'fr'}],
                u'creator': {u'name': u'Mr. Administrator'},
                u'bodyMimeType': u'text/html',
                u'publicationState': u'PUBLISHED'
    }}}


def test_mutation_create_post_without_subject(graphql_request, thematic_and_question):
    thematic_id, first_question_id = thematic_and_question
    res = schema.execute(u"""
mutation myFirstMutation {
    createPost(
        ideaId:"%s",
        body:"une proposition..."
    ) {
        post {
            ... on Post {
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
                u'subject': u'Proposal',
                u'body': u"une proposition...",
                u'creator': {u'name': u'Mr. Administrator'},
                u'mySentiment': None
    }}}


def test_mutation_create_post_on_column(graphql_request,
                                        test_session,
                                        idea_message_column_positive):
    idea_id = to_global_id('Idea', idea_message_column_positive.idea_id)
    classifier = idea_message_column_positive.message_classifier
    res = schema.execute(u"""
mutation myFirstMutation {
    createPost(
        ideaId:"%s",
        subject:"Proposition 1",
        body:"une proposition...",
        messageClassifier:"%s"
    ) {
        post {
            ... on Post {
                subject
                body
                bodyEntries { localeCode value }
                creator { name }
                bodyMimeType
                publicationState
                messageClassifier
            }
        }
    }
}
""" % (idea_id, classifier), context_value=graphql_request)

    # Must remove the ICL before test completes in order to avoid db constraint
    # on idea fixture removal
    icl = test_session.query(models.IdeaRelatedPostLink).\
        filter_by(idea_id=idea_message_column_positive.idea_id).first()
    test_session.delete(icl)
    test_session.flush()

    assert json.loads(json.dumps(res.data)) == {
        u'createPost': {
            u'post': {
                u'subject': u'Proposition 1',
                u'body': u"une proposition...",
                u'bodyEntries': [{u'value': u"une proposition...", u'localeCode': u'fr'}],
                u'creator': {u'name': u'Mr. Administrator'},
                u'bodyMimeType': u'text/html',
                u'publicationState': u'PUBLISHED',
                u'messageClassifier': classifier
    }}}


def test_mutation_delete_post(graphql_request, top_post_in_thread_phase):
    res = schema.execute(u"""
mutation myMutation($postId: ID!) {
    deletePost(postId: $postId) {
        post {
            ... on Post {
                subject
                body
                parentId
                creator { name }
                publicationState
            }
        }
    }
}
""", context_value=graphql_request, variable_values={"postId": top_post_in_thread_phase})
    assert json.loads(json.dumps(res.data)) == {
        u'deletePost': {
            u'post': {
                u'subject': u'Manger des choux à la crème',
                u'body': None,
                u'parentId': None,
                u'creator': {u'name': u'Mr. Administrator'},
                u'publicationState': 'DELETED_BY_USER'
    }}}


def test_mutation_undelete_post(graphql_request, top_post_in_thread_phase):
    res = schema.execute(u"""
mutation myMutation($postId: ID!) {
    deletePost(postId: $postId) {
        post {
            ... on Post {
                subject
                body
                parentId
                creator { name }
                publicationState
            }
        }
    }
}
""", context_value=graphql_request, variable_values={"postId": top_post_in_thread_phase})
    assert json.loads(json.dumps(res.data)) == {
        u'deletePost': {
            u'post': {
                u'subject': u'Manger des choux à la crème',
                u'body': None,
                u'parentId': None,
                u'creator': {u'name': u'Mr. Administrator'},
                u'publicationState': 'DELETED_BY_USER'
    }}}
    res = schema.execute(u"""
mutation myMutation($postId: ID!) {
    undeletePost(postId: $postId) {
        post {
            ... on Post {
                subject
                body
                parentId
                creator { name }
                publicationState
            }
        }
    }
}
""", context_value=graphql_request, variable_values={"postId": top_post_in_thread_phase})
    assert json.loads(json.dumps(res.data)) == {
        u'undeletePost': {
            u'post': {
                u'subject': u'Manger des choux à la crème',
                u'body': u"Je recommande de manger des choux à la crème, c'est très bon, et ça permet de maintenir l'industrie de la patisserie française.",
                u'parentId': None,
                u'creator': {u'name': u'Mr. Administrator'},
                u'publicationState': 'PUBLISHED'
    }}}


def test_mutation_add_sentiment(graphql_request, proposition_id):
    res = schema.execute(u"""
mutation myFirstMutation {
    addSentiment(
        postId:"%s",
        type:LIKE
    ) {
      post {
        ... on Post {
          sentimentCounts {
            like
            disagree
          }
          mySentiment
        }
      }
    }
}
""" % proposition_id, context_value=graphql_request)
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


def test_mutation_add_sentiment_like_then_disagree(graphql_request, proposition_id):
    res = schema.execute(u"""
mutation myFirstMutation {
    addSentiment(
        postId:"%s",
        type:LIKE
    ) {
    }
}
""" % proposition_id, context_value=graphql_request)
    res = schema.execute(u"""
mutation myFirstMutation {
    addSentiment(
        postId:"%s",
        type:DISAGREE
    ) {
      post {
        ... on Post {
          sentimentCounts {
            like
            disagree
          }
          mySentiment
        }
      }
    }
}
""" % proposition_id, context_value=graphql_request)
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


def test_mutation_add_sentiment_like_twice(graphql_request, proposition_id):
    res = schema.execute(u"""
mutation myFirstMutation {
    addSentiment(
        postId:"%s",
        type:LIKE
    ) {
    }
}
""" % proposition_id, context_value=graphql_request)
    res = schema.execute(u"""
mutation myFirstMutation {
    addSentiment(
        postId:"%s",
        type:LIKE
    ) {
      post {
        ... on Post {
          sentimentCounts {
            like
            disagree
          }
          mySentiment
        }
      }
    }
}
""" % proposition_id, context_value=graphql_request)
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


def test_mutation_delete_sentiment(graphql_request, proposition_id):
    res = schema.execute(u"""
mutation myFirstMutation {
    addSentiment(
        postId:"%s",
        type:LIKE
    ) {
      post {
        ... on Post {
          sentimentCounts {
            like
            disagree
          }
          mySentiment
        }
      }
    }
}
""" % proposition_id, context_value=graphql_request)
    res = schema.execute(u"""
mutation myFirstMutation {
    deleteSentiment(
        postId:"%s",
    ) {
      post {
        ... on Post {
          sentimentCounts {
            like
            disagree
          }
          mySentiment
        }
      }
    }
}
""" % proposition_id, context_value=graphql_request)
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

def test_mutation_create_top_post(graphql_request, idea_in_thread_phase, top_post_in_thread_phase):
    idea_id = idea_in_thread_phase
    in_reply_to_post_id = top_post_in_thread_phase
    res = schema.execute(u"""
mutation createPost($ideaId: ID!, $subject: String, $body: String!, $parentId: ID) {
  createPost(ideaId: $ideaId, subject: $subject, body: $body, parentId: $parentId) {
        post {
            ... on Post {
                subject,
                body,
                parentId,
                creator { name },
                indirectIdeaContentLinks { idea { id } }
            }
        }
    }
}
""", context_value=graphql_request, variable_values={
        "ideaId": idea_id,
        "parentId": None,
        "subject": u"Proposition 1",
        "body": u"une proposition..."
    })
    assert json.loads(json.dumps(res.data)) == {
        u'createPost': {
            u'post': {
                u'subject': u'Proposition 1',
                u'body': u"une proposition...",
                u'parentId': None,
                u'creator': {u'name': u'Mr. Administrator'},
                u'indirectIdeaContentLinks': [{u'idea': { u'id': idea_in_thread_phase }}]
    }}}

def test_mutation_create_reply_post(graphql_request, idea_in_thread_phase, top_post_in_thread_phase):
    idea_id = idea_in_thread_phase
    in_reply_to_post_id = top_post_in_thread_phase
    res = schema.execute(u"""
mutation createPost($ideaId: ID!, $subject: String, $body: String!, $parentId: ID) {
  createPost(ideaId: $ideaId, subject: $subject, body: $body, parentId: $parentId) {
        post {
            ... on Post {
                subject,
                body,
                parentId,
                creator { name },
                indirectIdeaContentLinks { idea { id } }
            }
        }
    }
}
""", context_value=graphql_request, variable_values={
        "ideaId": idea_id,
        "parentId": in_reply_to_post_id,
        "subject": u"Proposition 1",
        "body": u"une proposition..."
    })
    assert json.loads(json.dumps(res.data)) == {
        u'createPost': {
            u'post': {
                u'subject': u'Proposition 1',
                u'body': u"une proposition...",
                u'parentId': in_reply_to_post_id,
                u'creator': {u'name': u'Mr. Administrator'},
                u'indirectIdeaContentLinks': [{u'idea': { u'id': idea_in_thread_phase }}]
    }}}


def test_mutation_create_reply_post_no_subject(graphql_request, idea_in_thread_phase, top_post_in_thread_phase):
    idea_id = idea_in_thread_phase
    in_reply_to_post_id = top_post_in_thread_phase
    res = schema.execute(u"""
mutation myFirstMutation {
    createPost(
        ideaId:"%s",
        parentId:"%s",
        body:"une proposition..."
    ) {
        post {
            ... on Post {
                subject,
                body,
                parentId,
                creator { name },
            }
        }
    }
}
""" % (idea_id, in_reply_to_post_id), context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {
        u'createPost': {
            u'post': {
                u'subject': u'Re: Manger des choux à la crème',
                u'body': u"une proposition...",
                u'parentId': in_reply_to_post_id,
                u'creator': {u'name': u'Mr. Administrator'}
    }}}


def test_get_proposals(graphql_request, thematic_and_question, proposals):
    thematic_id, first_question_id = thematic_and_question
    res = schema.execute(u"""query {
        node(id:"%s") {
            ... on Question {
                title,
                posts(first:10) {
                    edges {
                        node {
                        ... on Post { body } } } } } } }""" % first_question_id, context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {
            u'node': {
                u"title": u"Comment qualifiez-vous l'emergence de l'Intelligence Artificielle dans notre soci\xe9t\xe9 ?",
                u"posts":
                    {u'edges': [{u'node': {u'body': u'une proposition 14'}},
                                {u'node': {u'body': u'une proposition 13'}},
                                {u'node': {u'body': u'une proposition 12'}},
                                {u'node': {u'body': u'une proposition 11'}},
                                {u'node': {u'body': u'une proposition 10'}},
                                {u'node': {u'body': u'une proposition 9'}},
                                {u'node': {u'body': u'une proposition 8'}},
                                {u'node': {u'body': u'une proposition 7'}},
                                {u'node': {u'body': u'une proposition 6'}},
                                {u'node': {u'body': u'une proposition 5'}}]},
                }}

def test_get_thematics_order(graphql_request, thematic_with_video_and_question, second_thematic_with_questions):

    res = schema.execute(
        u'query { thematics(identifier:"survey") { title, order } }',
        context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {
        u'thematics': [
            {u'order': 1.0, u'title': u'Understanding the dynamics and issues'},
            {u'order': 2.0, u'title': u'AI revolution'}
        ]
    }

def test_thematics_change_order(graphql_request, thematic_with_video_and_question, second_thematic_with_questions):
    thematic_id, _ = thematic_with_video_and_question
    res = schema.execute(u"""
mutation myMutation($thematicId:ID!, $order:Float!) {
    updateThematic(
        id:$thematicId,
        order:$order
    ) {
        thematic {
            order
        }
    }
}
""", context_value=graphql_request, variable_values={"thematicId": thematic_id,
                                                     "order": 3.0})

    res = schema.execute(
        u'query { thematics(identifier:"survey") { title, order } }',
        context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {
        u'thematics': [
            {u'order': 2.0, u'title': u'AI revolution'},
            {u'order': 3.0, u'title': u'Understanding the dynamics and issues'}
        ]
    }

def test_insert_thematic_between_two_thematics(graphql_request, thematic_with_video_and_question, second_thematic_with_questions):
    res = schema.execute(u"""
mutation myMutation {
    createThematic(
        titleEntries:[
            {value:"AI for the common good", localeCode:"en"}
        ],
        identifier:"survey",
        order: 1.5
    ) {
        thematic {
            order
        }
    }
}
""", context_value=graphql_request)

    res = schema.execute(
        u'query { thematics(identifier:"survey") { title, order } }',
        context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {
        u'thematics': [
            {u'order': 1.0, u'title': u'Understanding the dynamics and issues'},
            {u'order': 1.5, u'title': u'AI for the common good'},
            {u'order': 2.0, u'title': u'AI revolution'}
        ]
    }

def test_mutation_update_post(graphql_request, idea_in_thread_phase, top_post_in_thread_phase):
    idea_id = idea_in_thread_phase
    in_reply_to_post_id = top_post_in_thread_phase
    res = schema.execute(u"""
mutation myMutation($postId: ID!, $subject: String, $body: String!) {
    updatePost(
        postId: $postId,
        subject: $subject,
        body: $body
    ) {
        post {
            ... on Post {
                subject
                body
            }
        }
    }
}
""", context_value=graphql_request,
        variable_values={
            "postId": top_post_in_thread_phase,
            "subject": u"modified proposal",
            "body": u"the modified proposal..."
            })
    assert json.loads(json.dumps(res.data)) == {
        u'updatePost': {
            u'post': {
                u'subject': u'modified proposal',
                u'body': u"the modified proposal...",
    }}}

def test_mutation_update_post_with_subject_null(graphql_request, idea_in_thread_phase, top_post_in_thread_phase):
    idea_id = idea_in_thread_phase
    in_reply_to_post_id = top_post_in_thread_phase
    res = schema.execute(u"""
mutation myMutation($postId: ID!, $subject: String, $body: String!) {
    updatePost(
        postId: $postId,
        subject: $subject,
        body: $body
    ) {
        post {
            ... on Post {
                subject
                body
            }
        }
    }
}
""", context_value=graphql_request,
        variable_values={
            "postId": top_post_in_thread_phase,
            "body": u"the modified proposal..."
            })
    assert json.loads(json.dumps(res.data)) == {
        u'updatePost': {
            u'post': {
                u'subject': u'Manger des choux à la crème',
                u'body': u"the modified proposal...",
    }}}

def test_mutation_update_post_with_subject_empty_string(graphql_request, idea_in_thread_phase, top_post_in_thread_phase):
    idea_id = idea_in_thread_phase
    in_reply_to_post_id = top_post_in_thread_phase
    res = schema.execute(u"""
mutation myMutation($postId: ID!, $subject: String, $body: String!) {
    updatePost(
        postId: $postId,
        subject: $subject,
        body: $body
    ) {
        post {
            ... on Post {
                subject
                body
            }
        }
    }
}
""", context_value=graphql_request,
        variable_values={
            "postId": top_post_in_thread_phase,
            "subject": u"",
            "body": u"the modified proposal..."
            })
    assert json.loads(json.dumps(res.data)) == {
        u'updatePost': {
            u'post': {
                u'subject': u'Manger des choux à la crème',
                u'body': u"the modified proposal...",
    }}}


def test_mutation_upload_document(graphql_request, idea_in_thread_phase):
    import os
    from io import BytesIO

    class FieldStorage(object):
        file = BytesIO(os.urandom(16))
        filename = u'path/to/image.png'
        type = 'image/png'

    graphql_request.POST['variables.file'] = FieldStorage()
    res = schema.execute(u"""
mutation uploadDocument($file: String!) {
    uploadDocument(
        file: $file,
    ) {
        document {
            ... on Document {
                id
                externalUrl
            }
        }
    }
}
""", context_value=graphql_request,
        variable_values={
            "file": "variables.file"
            })
    assert res.data['uploadDocument']['document']['id'] is not None
    assert res.data['uploadDocument']['document']['externalUrl'].endswith('/data')
#    assert json.loads(json.dumps(res.data)) == {
#        u'uploadDocument': {
#            u'document': {
#                u'id': u'1',
#                u'externalUrl': u'http://localhost:6543/data/Discussion/1/documents/1/data',
#            }
#        }
#    }


def test_mutation_delete_post_attachment(graphql_request, idea_in_thread_phase, top_post_in_thread_phase):
    # TODO: write a test fixture that returns a post attachment id and remove AddPostAttachmentMutation everywhere
    idea_id = idea_in_thread_phase
    in_reply_to_post_id = top_post_in_thread_phase
    import os
    from io import BytesIO

    class FieldStorage(object):
        file = BytesIO(os.urandom(16))
        filename = u'path/to/image.png'
        type = 'image/png'

    graphql_request.POST['variables.attachment'] = FieldStorage()
    res = schema.execute(u"""
mutation addPostAttachment($postId: ID!, $file: String!) {
    addPostAttachment(
        postId: $postId,
        file: $file,
    ) {
        post {
            ... on Post {
                attachments {
                    id
                }
            }
        }
    }
}
""", context_value=graphql_request,
        variable_values={
            "postId": top_post_in_thread_phase,
            "file": "variables.attachment"
            })
    assert res.errors == []
    attachment_id = res.data['addPostAttachment']['post']['attachments'][-1]['id']

    res = schema.execute(u"""
mutation deletePostAttachment($postId: ID!, $attachmentId: Int!) {
    deletePostAttachment(
        postId: $postId,
        attachmentId: $attachmentId,
    ) {
        post {
            ... on Post {
                attachments {
                    document {
                        id
                        title
                        externalUrl
                        mimeType
                    }
                }
            }
        }
    }
}
""", context_value=graphql_request,
    variable_values={
        "attachmentId": attachment_id,
        "postId": top_post_in_thread_phase,
        })

    assert json.loads(json.dumps(res.data)) == {
        u'deletePostAttachment': {
            u'post': {
                u'attachments': []
            }
        }
    }


def test_query_discussion_preferences(graphql_request,
                                      discussion_with_lang_prefs):
    res = schema.execute(u"""
query { discussionPreferences { languages { locale, name(inLocale:"fr"), nativeName } } } """, context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {
        u'discussionPreferences': {
            u'languages':
                [
                    {u'locale': u'en', u'name': u'anglais', u'nativeName': u'English'},
                    {u'locale': u'fr', u'name': u'français', u'nativeName': u'français'},
                    {u'locale': u'ja', u'name': u'japonais', u'nativeName': u'日本語 (にほんご)'},
                ]
        }
    }


@pytest.mark.xfail
def test_query_default_discussion_preferences(graphql_request,
                                              discussion_with_lang_prefs):
    res = schema.execute(u"""
query { defaultPreferences { languages { locale, name(inLocale:"fr") } } }""", context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {
        u'defaultPreferences': {
            u'languages': [
                {u'locale': u'fr', u'name': u'français'},
                {u'locale': u'en', u'name': u'anglais'}
            ]
        }
    }


def test_mutation_update_language_preference(graphql_request,
                                             discussion_with_lang_prefs):
    res = schema.execute(u"""
mutation myMutation($languages: [String]!) {
    updateDiscussionPreferences(languages: $languages) {
        preferences {
            languages {
                locale
            }
        }
    }
}
""", context_value=graphql_request,
        variable_values={
            "languages": ["ja", "de"]
            })
    assert json.loads(json.dumps(res.data)) == {
        u'updateDiscussionPreferences': {
            u'preferences': {
                u'languages': [
                    {u'locale': u'ja'},
                    {u'locale': u'de'}
                ]
            }
    }}


def test_mutation_update_language_preference_empty_list(
    graphql_request, discussion_with_lang_prefs):
    res = schema.execute(u"""
mutation myMutation($languages: [String]!) {
    updateDiscussionPreferences(languages: $languages) {
        preferences {
            languages {
                locale
            }
        }
    }
}
""", context_value=graphql_request,
        variable_values={
            "languages": []
            })
    assert res.errors is not None


def test_query_post_message_classifier(graphql_request,
                                       root_post_1_with_positive_message_classifier):
    post_id = to_global_id('Post',
                           root_post_1_with_positive_message_classifier.id)
    res = schema.execute(u"""query {
        node(id:"%s") {
            ... on Post {
                messageClassifier
            }
        }
    }""" % (post_id), context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {
        u"node": {
            u"messageClassifier": u'positive'
        }
    }


def test_query_post_no_message_classifier(graphql_request,
                                          idea_message_column_positive,
                                          root_post_1):
    post_id = to_global_id('Post', root_post_1.id)
    res = schema.execute(u"""query {
        node(id:"%s") {
            ... on Post {
                messageClassifier
            }
        }
    }""" % (post_id), context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {
        u"node": {
            u"messageClassifier": None
        }
    }


def test_query_number_of_posts_on_column(
        graphql_request, idea_message_column_positive,
        root_post_en_under_positive_column_of_idea):

    idea_id = to_global_id('Idea', idea_message_column_positive.idea_id)
    res = schema.execute(u"""
query {
    idea: node(id:"%s") {
        ... on Idea {
            id
            messageColumns {
                messageClassifier
                numPosts
            }
        }
    }
}""" % (idea_id), context_value=graphql_request)
    res_data = json.loads(json.dumps(res.data))
    assert res_data[u'idea'][u'messageColumns'][0][u'numPosts'] == 1


def test_query_number_of_posts_on_multiple_columns(
        graphql_request,
        idea_message_column_positive,
        idea_message_column_negative,
        root_post_en_under_positive_column_of_idea,
        root_post_en_under_negative_column_of_idea):

    idea_id = to_global_id('Idea', idea_message_column_positive.idea_id)
    res = schema.execute(u"""
query {
    idea: node(id:"%s") {
        ... on Idea {
            id
            messageColumns {
                messageClassifier
                numPosts
            }
        }
    }
}""" % (idea_id), context_value=graphql_request)
    res_data = json.loads(json.dumps(res.data))
    columns = res_data[u'idea'][u'messageColumns']
    assert len(columns) == 2
    positive = filter(lambda c: c[u"messageClassifier"] == idea_message_column_positive.message_classifier, columns)[0]
    negative = filter(lambda c: c[u"messageClassifier"] == idea_message_column_negative.message_classifier, columns)[0]
    assert positive[u"numPosts"] == 1
    assert negative[u"numPosts"] == 1

def test_query_discussion_sentiments_count(
        graphql_request):
    res = schema.execute(u"""query {
        totalSentiments
    }""", context_value=graphql_request)
    res_data = json.loads(json.dumps(res.data))
    count = res_data[u"totalSentiments"]
    assert count == 0


def test_query_has_resources_center(discussion, resource, resource_with_image_and_doc, graphql_request):
    query = u"""
query { hasResourcesCenter }
"""
    res = schema.execute(query, context_value=graphql_request)
    assert res.data['hasResourcesCenter'] is True


def test_query_resources(discussion, resource, resource_with_image_and_doc, graphql_request):
    query = u"""
query { resources {
    id
    title(lang:"en")
    text(lang:"en")
    embedCode
    doc {
        externalUrl
        title
    }
    image {
        externalUrl
    }
} }"""
    res = schema.execute(query, context_value=graphql_request)
    assert res.data['resources'][0]['title'] == u'a resource'
    assert res.data['resources'][1]['title'] == u'another resource'
    assert res.data['resources'][0]['text'] == u'Lorem ipsum dolor sit amet'
    assert res.data['resources'][0]['embedCode'] == u'<iframe ...>'

    assert res.data['resources'][0]['doc'] == None
    assert res.data['resources'][0]['image'] == None

    assert '/documents/' in res.data['resources'][1]['image']['externalUrl']
    assert '/documents/' in res.data['resources'][1]['doc']['externalUrl']
    # this is the title of the File object, not the title of the ResourceAttachment object
    assert res.data['resources'][1]['doc']['title'] == "mydocument.pdf"


def test_mutation_create_resource_no_permission(graphql_request):
    graphql_request.authenticated_userid = None
    res = schema.execute(u"""
mutation createResource {
    createResource(titleEntries:[{value:"Peu importe", localeCode:"fr"}]) {
        resource {
            title
        }
    }
}
""", context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == { u'createResource': None }


def test_mutation_create_resource(graphql_request):
    title_entries = u'[{value:"Première ressource", localeCode:"fr"},{value:"First resource", localeCode:"en"}]'
    text_entries = u'[{value:"Lorem ipsum dolor sit amet, consectetur adipisicing elit.", localeCode:"fr"},{value:"Foobar", localeCode:"en"}]'
    embed_code = u'iframe foobar'

    import os
    from io import BytesIO

    class FieldStorage(object):
        file = BytesIO(os.urandom(16))

        def __init__(self, filename, type):
            self.filename = filename
            self.type = type

    graphql_request.POST['variables.img'] = FieldStorage(
        u'path/to/img.png', 'image/png')
    graphql_request.POST['variables.doc'] = FieldStorage(
        u'path/to/mydoc.pdf', 'application/pdf')

    res = schema.execute(u"""
mutation createResource($img:String,$doc:String) {
    createResource(
        titleEntries:%s,textEntries:%s,embedCode:"%s",image:$img,doc:$doc
    ) {
        resource {
            title(lang:"fr")
            text(lang:"fr")
            embedCode
            image {
                externalUrl
                title
            }
            doc {
                externalUrl
                title
            }
        }
    }
}
""" % (title_entries, text_entries, embed_code), context_value=graphql_request, variable_values={"img": u"variables.img", "doc": u"variables.doc"})
    result = res.data
    assert result is not None
    assert result['createResource'] is not None
    resource = result['createResource']['resource']
    assert resource['title'] == u'Première ressource'
    assert resource['text'] == u'Lorem ipsum dolor sit amet, consectetur adipisicing elit.'
    assert resource['embedCode'] == u'iframe foobar'

    assert '/documents/' in resource['image']['externalUrl']
    assert resource['image']['title'] == 'img.png'

    assert '/documents/' in resource['doc']['externalUrl']
    assert resource['doc']['title'] == 'mydoc.pdf'


def test_delete_resource(graphql_request, resource):
    resource_id = to_global_id('Resource', resource.id)
    res = schema.execute(u"""
mutation deleteResource {
    deleteResource(
        resourceId:"%s",
    ) {
        success
    }
}
""" % resource_id, context_value=graphql_request)
    assert res.data['deleteResource']['success'] is True
    res = schema.execute(u'query { resources { id } }', context_value=graphql_request)
    assert json.loads(json.dumps(res.data)) == {u'resources': []}


def test_update_resource(graphql_request, resource_with_image_and_doc):
    resource = resource_with_image_and_doc
    resource_id = to_global_id('Resource', resource.id)

    import os
    from io import BytesIO

    class FieldStorage(object):
        file = BytesIO(os.urandom(16))

        def __init__(self, filename, type):
            self.filename = filename
            self.type = type

    graphql_request.POST['variables.img'] = FieldStorage(
        u'path/to/new-img.png', 'image/png')
    graphql_request.POST['variables.doc'] = FieldStorage(
        u'path/to/new-doc.pdf', 'application/pdf')

    res = schema.execute(u"""
mutation updateResource($resourceId:ID!,$img:String,$doc:String) {
    updateResource(
        id:$resourceId,
        titleEntries:[
            {value:"My resource", localeCode:"en"},
            {value:"Ma ressource", localeCode:"fr"}
        ],
        textEntries:[
            {value:"Text in english", localeCode:"en"},
            {value:"Texte en français", localeCode:"fr"}
        ],
        embedCode:"nothing",
        image:$img,
        doc:$doc
    ) {
        resource {
            title(lang:"fr")
            text(lang:"fr")
            embedCode
            image {
                externalUrl
                title
            }
            doc {
                externalUrl
                title
            }
        }
    }
}
""", context_value=graphql_request, variable_values={"img": u"variables.img", "doc": u"variables.doc", "resourceId": resource_id})
    assert res.data is not None
    assert res.data['updateResource'] is not None
    assert res.data['updateResource']['resource'] is not None
    resource = res.data['updateResource']['resource']
    assert resource[u'title'] == u'Ma ressource'
    assert resource[u'text'] == u'Texte en français'
    assert resource[u'embedCode'] == u'nothing'

    assert '/documents/' in resource['image']['externalUrl']
    assert resource['image']['title'] == 'new-img.png'

    assert '/documents/' in resource['doc']['externalUrl']
    assert resource['doc']['title'] == 'new-doc.pdf'


def test_query_discussion_resources_center_fields(
        discussion, graphql_request, test_session, simple_file, moderator_user):

    from assembl.models.attachment import DiscussionAttachment
    header_image = DiscussionAttachment(
        discussion=discussion,
        document=simple_file,
        title=u"Resource center header image",
        creator=moderator_user,
        attachmentPurpose='RESOURCES_CENTER_HEADER_IMAGE'
    )

    discussion.resources_center_title = models.LangString.create(
        u"Resources center", "en")
    discussion.db.flush()

    res = schema.execute(u"""query {
        resourcesCenter {
            title(lang:"en")
            titleEntries {
                localeCode
                value
            }
            headerImage {
                externalUrl
                mimeType
            }
        }
    }""", context_value=graphql_request)
    res_data = json.loads(json.dumps(res.data))
    assert res_data['resourcesCenter']['title'] == u'Resources center'
    assert res_data['resourcesCenter']['titleEntries'][0]['localeCode'] == u'en'
    assert res_data['resourcesCenter']['titleEntries'][0]['value'] == u'Resources center'
    assert res_data['resourcesCenter']['headerImage']['mimeType'] == u'image/png'
    assert '/documents/' in res_data['resourcesCenter']['headerImage']['externalUrl']

    discussion.db.delete(header_image)
    discussion.db.flush()


def test_update_resources_center(graphql_request, discussion):
    import os
    from io import BytesIO

    class FieldStorage(object):
        file = BytesIO(os.urandom(16))

        def __init__(self, filename, type):
            self.filename = filename
            self.type = type

    graphql_request.POST['variables.headerImage'] = FieldStorage(
        u'path/to/new-img.png', 'image/png')

    res = schema.execute(u"""
mutation updateResourcesCenter($headerImage:String) {
    updateResourcesCenter(
        titleEntries:[
            {value:"My great resources center", localeCode:"en"},
            {value:"Mon super centre de ressources", localeCode:"fr"}
        ],
        headerImage:$headerImage,
    ) {
        resourcesCenter {
            titleEntries {
                localeCode
                value
            }
            headerImage {
                externalUrl
                title
            }
        }
    }
}
""", context_value=graphql_request, variable_values={"headerImage": u"variables.headerImage"})
    assert res.data is not None

    assert res.data['updateResourcesCenter'] is not None
    assert res.data['updateResourcesCenter']['resourcesCenter'] is not None

    resources_center = res.data['updateResourcesCenter']['resourcesCenter']
    assert resources_center['titleEntries'][0]['localeCode'] == 'en'
    assert resources_center['titleEntries'][0]['value'] == 'My great resources center'
    assert resources_center['titleEntries'][1]['localeCode'] == 'fr'
    assert resources_center['titleEntries'][1]['value'] == 'Mon super centre de ressources'
    assert resources_center['headerImage'] is not None
    assert '/documents/' in resources_center['headerImage']['externalUrl']
    assert resources_center['headerImage']['title'] == 'new-img.png'
