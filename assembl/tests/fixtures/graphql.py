# -*- coding: utf-8 -*-
from datetime import datetime
import pytest



@pytest.fixture(scope="function")
def graphql_request(request, test_adminuser_webrequest, discussion):
    """ A graphql request fixture with an ADMIN user authenticated """
    req = test_adminuser_webrequest
    req.matchdict = {"discussion_id": discussion.id}
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


@pytest.fixture(scope="function")
def phases(request, test_session, discussion):
    from assembl.models import DiscussionPhase, LangString
    from assembl import models

    survey = DiscussionPhase(
        discussion = discussion,
        identifier = 'survey',
        title = LangString.create(u"survey phase title fixture", "en"),
        description = LangString.create(u"survey phase description fixture", "en"),
        start = datetime(2018, 1, 15, 9, 0, 0),
        end = datetime(2018, 2, 15, 9, 0, 0),
        interface_v1 = False,
        image_url = u'https://example.net/image.jpg',
        is_thematics_table = True
    )

    thread = DiscussionPhase(
        discussion = discussion,
        identifier = 'thread',
        title = LangString.create(u"thread phase title fixture", "en"),
        description = LangString.create(u"thread phase description fixture", "en"),
        start = datetime(2018, 2, 16, 9, 0, 0),
        end = datetime(2018, 3, 15, 9, 0, 0),
        interface_v1 = False,
        image_url = u'https://example.net/image.jpg'
    )

    multiColumns = DiscussionPhase(
        discussion = discussion,
        identifier = 'multiColumns',
        title = LangString.create(u"multiColumns phase title fixture", "en"),
        description = LangString.create(u"multiColumns phase description fixture", "en"),
        start = datetime(2018, 3, 16, 9, 0, 0),
        end = datetime(2018, 4, 15, 9, 0, 0),
        interface_v1 = False,
        image_url = u'https://example.net/image.jpg'
    )

    voteSession = DiscussionPhase(
        discussion = discussion,
        identifier = 'voteSession',
        title = LangString.create(u"voteSession phase title fixture", "en"),
        description = LangString.create(u"voteSession phase description fixture", "en"),
        start = datetime(2018, 4, 16, 9, 0, 0),
        end = datetime(2018, 5, 15, 9, 0, 0),
        interface_v1 = False,
        image_url = u'https://example.net/image.jpg',
        is_thematics_table = True
    )

    brightMirror = DiscussionPhase(
        discussion = discussion,
        identifier = 'brightMirror',
        title = LangString.create(u"brightMirror phase title fixture", "en"),
        description = LangString.create(u"brightMirror phase description fixture", "en"),
        start = datetime(2018, 6, 16, 9, 0, 0),
        end = datetime(2018, 7, 15, 9, 0, 0),
        interface_v1 = False,
        image_url = u'https://example.net/image.jpg',
        is_thematics_table = True
    )

    # Create the phase
    test_session.add(survey)
    test_session.add(thread)
    test_session.add(multiColumns)
    test_session.add(voteSession)
    test_session.add(brightMirror)
    test_session.flush()

    def fin():
        print "finalizer timeline"
        test_session.delete(survey)
        test_session.delete(thread)
        test_session.delete(multiColumns)
        test_session.delete(voteSession)
        test_session.delete(brightMirror)
        test_session.flush()

    request.addfinalizer(fin)
    phases = test_session.query(models.DiscussionPhase).all()
    return {p.identifier: p for p in phases}


@pytest.fixture(scope="function")
def idea_in_thread_phase(phases, graphql_request):
    from assembl.graphql.schema import Schema as schema
    res = schema.execute(u"""
mutation myFirstMutation {
    createThematic(
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
    return idea_id

@pytest.fixture(scope="function")
def another_idea_in_thread_phase(phases, graphql_request):
    from assembl.graphql.schema import Schema as schema
    res = schema.execute(u"""
mutation myFirstMutation {
    createThematic(
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
    return idea_id


@pytest.fixture(scope="function")
def top_post_in_thread_phase(graphql_request, idea_in_thread_phase):
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

    return post_id


@pytest.fixture(scope="function")
def thematic_and_question(phases, graphql_request):
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
        discussionPhaseId: """+unicode(phases['survey'].id)+u""",
    ) {
        thematic {
            ... on Thematic {
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
    return thematic_id, first_question_id


@pytest.fixture(scope="function")
def thematic_with_video_and_question(phases, graphql_request):
    from assembl.graphql.schema import Schema as schema
    res = schema.execute(u"""
mutation myMutation {
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
            descriptionEntriesTop:[
                {value:"Personne ne veut d'un monde où on pourrait manipuler nos cerveaux et où les états pourraient les bidouiller",
                 localeCode:"fr"},
            ],
            descriptionEntriesBottom:[
                {value:"Câlisse de tabarnak",
                 localeCode:"fr"},
            ],
            descriptionEntriesSide:[
                {value:"Putain",
                 localeCode:"fr"},
            ],
            htmlCode:"https://something.com"
        },
        discussionPhaseId: """+unicode(phases['survey'].id)+u""",
    ) {
        thematic {
            ... on Thematic {
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
    return thematic_id, first_question_id


@pytest.fixture(scope="function")
def second_thematic_with_questions(phases, graphql_request):
    from assembl.graphql.schema import Schema as schema
    res = schema.execute(u"""
mutation myMutation {
    createThematic(
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
        video: {
            titleEntries:[
                {value:"A video to better understand the subject...",
                 localeCode:"en"},
            ]
            htmlCode:"https://www.youtube.com/embed/GJM1TlHML4E?list=PL1HxVG_mcuktmbRELCxOiQlZLCFKzhBcJ"
        },
        discussionPhaseId: """+unicode(phases['survey'].id)+u""",
    ) {
        thematic {
            ... on Thematic {
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
    return thematic_id, question_ids


@pytest.fixture(scope="function")
def thematic_with_image(phases, graphql_request):
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
        titleEntries:[
            {value:"You can't program the card without transmitting the wireless AGP card!", localeCode:"en"}
        ],
        discussionPhaseId: """+unicode(phases['survey'].id)+u""",
        image: $file
    ) {
        thematic {
            ... on Thematic {
                id,
                img { externalUrl }
            }
        }
    }
}
""", context_value=graphql_request, variable_values={ "file": "variables.file" })
    thematic_id = res.data['createThematic']['thematic']['id']
    return thematic_id


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



def create_proposal_x(graphql_request, first_question_id, idx):
    from assembl.graphql.schema import Schema as schema
    res = schema.execute(u"""
mutation myFirstMutation {
    createPost(
        ideaId:"%s",
        body:"une proposition %s"
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


@pytest.fixture(scope="function")
def synthesis_in_syntheses(graphql_request, synthesis_post_1):
    from assembl.graphql.schema import Schema as schema
    res = schema.execute(
        u"""query SynthesesQuery($lang: String!) {
            syntheses {
                ... on Synthesis {
                  id
                  subject(lang: $lang)
                  ideas {
                    ... on Idea {
                      img { externalUrl }
                    }
                  }
                }
              } }
        """,
        context_value=graphql_request,
        variable_values={
            "lang": "en"
        })
    assert res.data
    return res
