# -*- coding: utf-8 -*-
from datetime import datetime
import pytest
from freezegun import freeze_time

from graphql_relay.node.node import from_global_id


@pytest.fixture(scope="function")
def graphql_request(request, test_adminuser_webrequest, discussion):
    """ A graphql request fixture with an ADMIN user authenticated """
    req = test_adminuser_webrequest
    req.matchdict = {"discussion_id": discussion.id}
    req.method = 'POST'
    return req


@pytest.fixture(scope="function")
def graphql_request_with_moderation(request, test_adminuser_webrequest, discussion_with_moderation):
    """ A graphql request fixture with an ADMIN user authenticated """
    req = test_adminuser_webrequest
    req.matchdict = {"discussion_id": discussion_with_moderation.id}
    req.method = 'POST'
    return req


@pytest.fixture(scope="function")
def graphql_request_with_semantic_analysis(request, test_adminuser_webrequest, discussion_with_semantic_analysis):
    """ A graphql request fixture with an ADMIN user authenticated """
    req = test_adminuser_webrequest
    req.matchdict = {"discussion_id": discussion_with_semantic_analysis.id}
    req.method = 'POST'
    return req


@pytest.fixture(scope="function")
def graphql_request_with_translation(request, test_adminuser_webrequest, discussion_with_translation):
    """ A graphql request fixture with an ADMIN user authenticated """
    req = test_adminuser_webrequest
    req.matchdict = {"discussion_id": discussion_with_translation.id}
    req.method = 'POST'
    return req


@pytest.fixture(scope="function")
def graphql_unauthenticated_request(request, test_webrequest, discussion):
    req = test_webrequest
    req.matchdict = {"discussion_id": discussion.id}
    req.method = 'POST'
    return req


@pytest.fixture(scope="function")
def graphql_participant1_request(request, test_participant1_webrequest, discussion_with_default_data):
    req = test_participant1_webrequest
    req.matchdict = {"discussion_id": discussion_with_default_data.id}
    req.method = 'POST'
    return req


@freeze_time("2018-3-1")
@pytest.fixture(scope="function")
def idea_in_thread_phase(request, test_session, phases, graphql_request):
    from assembl.graphql.schema import Schema as schema
    res = schema.execute(u"""
mutation myFirstMutation {
    createThematic(
        messageViewOverride: "survey",
        discussionPhaseId: """+unicode(phases['thread'].id)+u""",
        titleEntries:[
            {value:"Comprendre les dynamiques et les enjeux", localeCode:"fr"},
            {value:"Understanding the dynamics and issues", localeCode:"en"}
        ],
    ) {
        thematic {
            ... on Idea {
                id
                titleEntries { localeCode value }
            }
        }
    }
}
""", context_value=graphql_request)
    assert res.errors is None
    idea_id = res.data['createThematic']['thematic']['id']

    def fin():
        from assembl.models import Idea
        idea = test_session.query(Idea).get(int(from_global_id(idea_id)[1]))
        test_session.delete(idea)
        test_session.flush()

    request.addfinalizer(fin)
    return idea_id


@freeze_time("2018-3-1")
@pytest.fixture(scope="function")
def another_idea_in_thread_phase(request, test_session, phases, graphql_request):
    from assembl.graphql.schema import Schema as schema
    res = schema.execute(u"""
mutation myFirstMutation {
    createThematic(
        messageViewOverride: "survey",
        discussionPhaseId: """+unicode(phases['thread'].id)+u""",
        titleEntries:[
            {value:"Manger des pâtes", localeCode:"fr"},
            {value:"Eating pasta", localeCode:"en"}
        ],
    ) {
        thematic {
            ... on Idea {
                id
                titleEntries { localeCode value }
            }
        }
    }
}
""", context_value=graphql_request)
    assert res.errors is None
    idea_id = res.data['createIdea']['thematic']['id']

    def fin():
        from assembl.models import Idea
        idea = test_session.query(Idea).get(int(from_global_id(idea_id)[1]))
        test_session.delete(idea)
        test_session.flush()

    request.addfinalizer(fin)
    return idea_id


@freeze_time("2018-3-1")
@pytest.fixture(scope="function")
def top_post_in_thread_phase(request, test_session, graphql_request, idea_in_thread_phase):
    from assembl.graphql.schema import Schema as schema
    idea_id = idea_in_thread_phase
    res = schema.execute(u"""
mutation myFirstMutation {
    createPost(
        ideaId:"%s",
        subject:"Manger des choux à la crème",
        body:"Je recommande de manger des choux à la crème, c'est très bon, et ça permet de maintenir l'industrie de la patisserie française."
    ) {
        post {
            ... on Post {
                id
            }
        }
    }
}
""" % idea_id, context_value=graphql_request)
    post_id = res.data['createPost']['post']['id']
    def fin():
        from assembl.models import Post
        post = test_session.query(Post).get(int(from_global_id(post_id)[1]))
        test_session.delete(post)
        test_session.flush()

    request.addfinalizer(fin)
    return post_id

@freeze_time("2018-2-1")
@pytest.fixture(scope="function")
def thematic_and_question(request, test_session, phases, graphql_request):
    from assembl.graphql.schema import Schema as schema
    res = schema.execute(u"""
mutation myFirstMutation {
    createThematic(
        messageViewOverride: "survey",
        titleEntries:[
            {value:"Comprendre les dynamiques et les enjeux", localeCode:"fr"},
            {value:"Understanding the dynamics and issues", localeCode:"en"}
        ],
        questions:[
            {titleEntries:[
                {value:"Comment qualifiez-vous l'emergence de l'Intelligence Artificielle dans notre société ?", localeCode:"fr"}
            ]},
        ],
        discussionPhaseId: """+unicode(phases['survey'].id)+u""",
    ) {
        thematic {
            ... on Idea {
                id,
                titleEntries { localeCode value },
                questions { id, titleEntries { localeCode value } }
            }
        }
    }
}
""", context_value=graphql_request)
    thematic_id = res.data['createThematic']['thematic']['id']
    first_question_id = res.data['createThematic']['thematic']['questions'][0]['id']

    def fin():
        from assembl.models import Idea, Question
        idea = test_session.query(Idea).get(int(from_global_id(thematic_id)[1]))
        test_session.delete(idea)
        question = test_session.query(Question).get(int(from_global_id(first_question_id)[1]))
        test_session.delete(question)
        test_session.flush()

    request.addfinalizer(fin)
    return thematic_id, first_question_id


@pytest.fixture(scope="function")
def thematic_with_question(request, test_session, phases, graphql_request):
    from assembl.graphql.schema import Schema as schema
    res = schema.execute(u"""
mutation myMutation {
    createThematic(
        messageViewOverride: "survey",
        titleEntries:[
            {value:"Comprendre les dynamiques et les enjeux", localeCode:"fr"},
            {value:"Understanding the dynamics and issues", localeCode:"en"}
        ],
        questions:[
            {titleEntries:[
                {value:"Comment qualifiez-vous l'emergence de l'Intelligence Artificielle dans notre société ?", localeCode:"fr"}
            ]},
        ],
        discussionPhaseId: """+unicode(phases['survey'].id)+u""",
    ) {
        thematic {
            ... on Idea {
                id,
                titleEntries { localeCode value },
                questions { id, titleEntries { localeCode value } }
            }
        }
    }
}
""", context_value=graphql_request)
    thematic_id = res.data['createThematic']['thematic']['id']
    first_question_id = res.data['createThematic']['thematic']['questions'][0]['id']

    def fin():
        from assembl.models import Idea, Question
        idea = test_session.query(Idea).get(int(from_global_id(thematic_id)[1]))
        test_session.delete(idea)
        question = test_session.query(Question).get(int(from_global_id(first_question_id)[1]))
        test_session.delete(question)
        test_session.flush()

    request.addfinalizer(fin)
    return thematic_id, first_question_id


@pytest.fixture(scope="function")
def second_thematic_with_questions(request, test_session, phases, graphql_request):
    from assembl.graphql.schema import Schema as schema
    res = schema.execute(u"""
mutation myMutation {
    createThematic(
        messageViewOverride: "survey",
        titleEntries:[
            {value:"AI revolution", localeCode:"en"}
        ],
        questions:[
            {titleEntries:[
                {value:"How does AI already impact us?", localeCode:"en"}
            ]},
            {titleEntries:[
                {value:"What are the most promising AI applications in the short term?", localeCode:"en"}
            ]},
            {titleEntries:[
                {value:"How would you explain algorithmic biases to a kid?", localeCode:"en"}
            ]},
            {titleEntries:[
                {value:"What sectors will be the most affected by AI?", localeCode:"en"}
            ]},
        ],
        discussionPhaseId: """+unicode(phases['survey'].id)+u""",
    ) {
        thematic {
            ... on Idea {
                id
                order,
                titleEntries { localeCode value },
                questions { id, titleEntries { localeCode value } }
            }
        }
    }
}
""", context_value=graphql_request)
    thematic_id = res.data['createThematic']['thematic']['id']
    question_ids = [question['id']
        for question in res.data['createThematic']['thematic']['questions']]

    def fin():
        from assembl.models import Idea, Question
        idea = test_session.query(Idea).get(int(from_global_id(thematic_id)[1]))
        test_session.delete(idea)
        for question_id in question_ids:
            question = test_session.query(Question).get(int(from_global_id(question_id)[1]))
            test_session.delete(question)
        test_session.flush()

    request.addfinalizer(fin)
    return thematic_id, question_ids


@pytest.fixture(scope="function")
def thematic_with_image(request, test_session, phases, graphql_request):
    from assembl.graphql.schema import Schema as schema
    import os
    from io import BytesIO

    class FieldStorage(object):
        file = BytesIO(os.urandom(16))
        filename = u'path/to/image.png'
        type = 'image/png'

    graphql_request.POST['variables.file'] = FieldStorage()
    res = schema.execute(u"""
mutation createThematicWithImage($file: String!) {
    createThematic(
        messageViewOverride: "survey",
        titleEntries:[
            {value:"You can't program the card without transmitting the wireless AGP card!", localeCode:"en"}
        ],
        discussionPhaseId: """+unicode(phases['survey'].id)+u""",
        image: $file
    ) {
        thematic {
            ... on Idea {
                id,
                img { externalUrl }
            }
        }
    }
}
""", context_value=graphql_request, variable_values={ "file": "variables.file" })
    thematic_id = res.data['createThematic']['thematic']['id']
    def fin():
        from assembl.models import Idea
        idea = test_session.query(Idea).get(int(from_global_id(thematic_id)[1]))
        test_session.delete(idea)
        test_session.flush()

    request.addfinalizer(fin)
    return thematic_id


@freeze_time("2018-2-1")
@pytest.fixture(scope="function")
def proposition_id(request, test_session, graphql_request, thematic_and_question):
    from assembl.models import PropositionPost
    from assembl.graphql.schema import Schema as schema
    thematic_id, first_question_id = thematic_and_question
    res = schema.execute(u"""
mutation myFirstMutation {
    createPost(
        ideaId:"%s",
        body:"une proposition..."
    ) {
        post {
            ... on Post {
                id,
                body,
                creator { name },
            }
        }
    }
}
""" % first_question_id, context_value=graphql_request)
    post_id = res.data['createPost']['post']['id']
    def fin():
        print "proposition_id"
        post = test_session.query(PropositionPost).get(int(from_global_id(post_id)[1]))
        test_session.delete(post)
        test_session.flush()
    request.addfinalizer(fin)
    return post_id


def create_proposal_en_fr_x(request, session, discussion, creator_id,
                            idea_id, num):
    from assembl.models import (
        PropositionPost,
        IdeaRelatedPostLink,
        Locale,
        LangString,
        LangStringEntry)

    en_locale = Locale.get_or_create('en')
    fr_locale = Locale.get_or_create('fr')
    mt_locale = Locale.create_mt_locale(en_locale, fr_locale, db=session)

    body = LangString.create(u"English Proposition %d" % num, 'en')
    body.add_entry(LangStringEntry(
                   locale=mt_locale,
                   value=u'French Proposition %d' % num,
                   locale_confirmed=True))

    post = PropositionPost(
        discussion=discussion,
        creator_id=creator_id,
        subject=None,
        body=body,
        body_mime_type=u'text/html',
        message_id="post_%d@assembl.com" % num
    )

    icl = IdeaRelatedPostLink(
        idea_id=idea_id,
        content=post,
        discussion=discussion,
        creator_id=creator_id
    )

    session.add(post)
    session.add(icl)
    session.flush()

    def fin():
        session.delete(icl)
        session.delete(post)
        session.delete(mt_locale)
        session.flush()

    request.addfinalizer(fin)
    return post


def create_proposal_x(request, session, graphql_request, first_question_id, idx, publication_state):
    from assembl.graphql.schema import Schema as schema
    from assembl.models import PublicationStates
    body = "une proposition {}".format(idx)
    if publication_state == PublicationStates.SUBMITTED_AWAITING_MODERATION.value:
        body = "une proposition en attente de validation {}".format(idx)

    res = schema.execute(u"""
mutation myFirstMutation {
    createPost(
        ideaId:"%s",
        body:"%s"
        publicationState:%s
    ) {
        post {
            ... on Post {
                id,
                body,
                creator { name },
            }
        }
    }
}
""" % (first_question_id, body, publication_state),
        context_value=graphql_request)
    post_id = res.data['createPost']['post']['id']
    def fin():
        from assembl.models import PropositionPost
        post = session.query(PropositionPost).get(int(from_global_id(post_id)[1]))
        session.delete(post)
        session.flush()

    request.addfinalizer(fin)
    return post_id


@freeze_time("2018-2-1")
@pytest.fixture(scope="function")
def proposals15published(request, test_session, graphql_request, admin_user, thematic_and_question):
    from assembl.models import PublicationStates
    graphql_request.authenticated_userid = admin_user.id
    thematic_id, first_question_id = thematic_and_question
    proposals = []
    for idx in range(15):
        publication_state = PublicationStates.PUBLISHED.value
        proposal_id = create_proposal_x(
            request, test_session, graphql_request, first_question_id, idx, publication_state)
        proposals.append(proposal_id)

    return proposals


@freeze_time("2018-2-1")
@pytest.fixture(scope="function")
def proposals(request, test_session, graphql_request, admin_user, thematic_and_question):
    from assembl.models import PublicationStates
    graphql_request.authenticated_userid = admin_user.id
    thematic_id, first_question_id = thematic_and_question
    proposals = []
    for idx in range(20):
        if idx >= 15:
            publication_state = PublicationStates.SUBMITTED_AWAITING_MODERATION.value
        else:
            publication_state = PublicationStates.PUBLISHED.value
        proposal_id = create_proposal_x(
            request, test_session, graphql_request, first_question_id, idx, publication_state)
        proposals.append(proposal_id)

    return proposals


@freeze_time("2018-2-1")
@pytest.fixture(scope="function")
def proposals_no_pending(request, test_session, graphql_request, admin_user, thematic_and_question):
    from assembl.models import PublicationStates
    graphql_request.authenticated_userid = admin_user.id
    thematic_id, first_question_id = thematic_and_question
    proposals = []
    for idx in range(10):
        publication_state = PublicationStates.PUBLISHED.value
        proposal_id = create_proposal_x(
            request, test_session, graphql_request, first_question_id, idx, publication_state)
        proposals.append(proposal_id)

    return proposals


@pytest.fixture(scope="function")
def proposals_en_fr(request, test_session, graphql_request,
                    thematic_and_question):
    from assembl.models import Discussion
    from graphene.relay import Node
    thematic_id, first_question_id = thematic_and_question
    question_id = Node.from_global_id(first_question_id)[1]
    discussion_id = graphql_request.matchdict['discussion_id']
    discussion = test_session.query(Discussion).filter_by(
        id=discussion_id).first()
    creator_id = graphql_request.authenticated_userid
    proposals = []
    for idx in range(15):
        proposal = create_proposal_en_fr_x(request, test_session, discussion,
                                           creator_id, question_id, idx)
        proposals.append(proposal)
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
        ... on Post {
          mySentiment
        }
      }
    }
}
""" % (proposal_id, 'LIKE')
    schema.execute(
        mutation,
        context_value=graphql_request)
