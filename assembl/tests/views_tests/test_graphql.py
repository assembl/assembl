# -*- coding: utf-8 -*-
import json

import pytest
from graphql_relay.node.node import to_global_id

from assembl import models
from assembl.graphql.schema import Schema as schema


@pytest.fixture(scope="function")
def graphql_request(request, test_adminuser_webrequest, discussion):
    req = test_adminuser_webrequest
    req.matchdict = {"discussion_id": discussion.id}
    return req


def test_get_thematics_noresult(graphql_request):
    res = schema.execute('query { thematics(identifier:"survey") { id, title, description, numPosts, numContributors, questions { title }, video {title, description, htmlCode} } }', context_value=graphql_request)
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

    res = schema.execute('query { thematics(identifier:"survey") { id, title, description, numPosts, numContributors, questions { title }, video {title, description, htmlCode} } }', context_value=graphql_request)
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

    res = schema.execute('query { thematics(identifier:"survey") { id, title, description, numPosts, numContributors, questions { title }, video {title, description, htmlCode} } }', context_value=graphql_request)
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
    res = schema.execute("""
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
    res = schema.execute("""
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
                u'identifier': 'survey'
    }}}


def test_mutation_create_thematic_multilang_implicit_fr(graphql_request, user_language_preference_fr_cookie):
    # adding en then fr on purpose, to really test that it looks at user preferences, not just the first original title
    res = schema.execute("""
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
                u'identifier': 'survey'
    }}}


def test_mutation_create_thematic_multilang_explicit_fr(graphql_request):
    res = schema.execute("""
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
                u'identifier': 'survey'
    }}}


def test_mutation_create_thematic_multilang_explicit_en(graphql_request):
    res = schema.execute("""
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
    res = schema.execute("""
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
    res = schema.execute("""
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
