# -*- coding: utf-8 -*-
import pytest


@pytest.fixture(scope="function")
def graphql_request(request, test_adminuser_webrequest, discussion, fr_locale, en_locale):
    req = test_adminuser_webrequest
    req.matchdict = {"discussion_id": discussion.id}
    req.method = 'POST'
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
def thematic_with_video_and_question(graphql_request):
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
    res = schema.execute(u"""
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
    return res.data['createPost']['post']['id']


@pytest.fixture(scope="function")
def proposals(graphql_request, thematic_and_question):
    thematic_id, first_question_id = thematic_and_question
    proposals = []
    for idx in range(15):
        proposal_id = create_proposal_x(graphql_request, first_question_id, idx)
        proposals.append(proposal_id)

    return proposals


@pytest.fixture(scope="function")
def proposals_with_sentiments(graphql_request, proposals, admin_user):
    from assembl.graphql.schema import Schema as schema
    # add a sentiment to the first post
    proposal_id = proposals[0]
    mutation = u"""
mutation myFirstMutation {
    addSentiment(
        postId:"%s",
        type:%s
    ) {
      post {
        ... on PropositionPost {
          mySentiment
        }
      }
    }
}
""" % (proposal_id, 'LIKE')
    schema.execute(
        mutation,
        context_value=graphql_request)
