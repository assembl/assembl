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


def test_get_thematics(discussion, graphql_request, test_session):
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


def test_mutation_create_thematic(graphql_request):
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
    assert json.loads(json.dumps(res.data)) == {
        u'createThematic': {
            u'thematic': {
                u'title': u'Comprendre les dynamiques et les enjeux',
                u'identifier': 'survey'
    }}}


def test_mutation_create_thematic_multilang(graphql_request):
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
                u'title': u'Comprendre les dynamiques et les enjeux',
                u'identifier': 'survey'
    }}}


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
