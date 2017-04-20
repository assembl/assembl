# -*- coding: utf-8 -*-
import pytest


@pytest.fixture(scope="function")
def graphql_request(request, test_adminuser_webrequest, discussion, fr_locale, en_locale):
    req = test_adminuser_webrequest
    req.matchdict = {"discussion_id": discussion.id}
    return req


@pytest.fixture(scope="function")
def thematic_and_question(graphql_request):
    from assembl.graphql.schema import Schema as schema
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


@pytest.fixture(scope="function")
def proposition_id(graphql_request, thematic_and_question):
    from assembl.graphql.schema import Schema as schema
    thematic_id, first_question_id = thematic_and_question
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


def create_proposal_x(graphql_request, first_question_id, idx):
    from assembl.graphql.schema import Schema as schema
    schema.execute(u"""
mutation myFirstMutation {
    createPost(
        ideaId:"%s",
        body:"une proposition %s"
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
""" % (first_question_id, idx), context_value=graphql_request)


@pytest.fixture(scope="function")
def proposals(graphql_request, thematic_and_question):
    thematic_id, first_question_id = thematic_and_question
    for idx in range(15):
        create_proposal_x(graphql_request, first_question_id, idx)
