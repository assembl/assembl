# -*- coding: utf-8 -*-
import json
import pytest
from graphql_relay.node.node import from_global_id, to_global_id

from assembl import models
from assembl.graphql.schema import Schema as schema
from freezegun import freeze_time


def test_graphql_get_all_ideas(phases, graphql_request,
                               user_language_preference_en_cookie,
                               subidea_1_1_1):
    res = schema.execute(
        u"""query AllIdeasQuery($lang: String!, $discussionPhaseId: Int!) {
            ideas(discussionPhaseId: $discussionPhaseId) {
              ... on Idea {
                id
                title(lang: $lang)
                titleEntries { value, localeCode }
                messageViewOverride
                numPosts
                numContributors
                totalSentiments
                numChildren(discussionPhaseId: $discussionPhaseId)
                parentId
                order
                posts(first:10) {
                  edges {
                    node {
                      ... on Post { subject body }
                    }
                  }
                }
              }
            }
            rootIdea(discussionPhaseId: $discussionPhaseId) {
              ... on Node {
                id
              }
            }
        }
        """, context_value=graphql_request,
        variable_values={"discussionPhaseId": phases['thread'].id, "lang": u"en"})
    root_idea = res.data['rootIdea']
    assert root_idea['id'] is not None
    assert len(res.data['ideas']) == 3
    first_idea = res.data['ideas'][0]
    second_idea = res.data['ideas'][1]
    third_idea = res.data['ideas'][2]
    assert first_idea['title'] == u'Favor economic growth'
    assert first_idea['parentId'] == root_idea['id']
    assert first_idea['order'] == 0.0
    assert first_idea['numChildren'] == 1
    assert first_idea['numPosts'] == 0
    assert first_idea['numContributors'] == 0
    assert first_idea['totalSentiments'] == 0
    assert first_idea['messageViewOverride'] is None
    assert second_idea['title'] == u'Lower taxes'
    assert second_idea['parentId'] == first_idea['id']
    assert second_idea['order'] == 0.0
    assert second_idea['numChildren'] == 1
    assert third_idea['title'] == u'Lower government revenue'
    assert third_idea['parentId'] == second_idea['id']
    assert third_idea['order'] == 0.0
    assert third_idea['numChildren'] == 0
    assert res.errors is None


def test_graphql_get_all_ideas_thread_without_vote_proposals(phases, graphql_request,
                               user_language_preference_en_cookie,
                               vote_proposal):
    # proposals of vote session are attached as children of vote_session.idea
    # Those proposals shouldn't be returned.
    res = schema.execute(
        u"""query AllIdeasQuery($lang: String!, $discussionPhaseId: Int!) {
            ideas(discussionPhaseId: $discussionPhaseId) {
              ... on Idea {
                id
                title(lang: $lang)
              }
            }
            rootIdea(discussionPhaseId: $discussionPhaseId) {
              ... on Node {
                id
              }
            }
        }
        """, context_value=graphql_request,
        variable_values={"discussionPhaseId": phases['thread'].id, "lang": u"en"})
    root_idea = res.data['rootIdea']
    assert root_idea['id'] is not None
    assert len(res.data['ideas']) == 2


def test_graphql_get_all_ideas_survey_phase(phases, graphql_request,
                               user_language_preference_en_cookie,
                               thematic_and_question):
    res = schema.execute(
        u"""query AllIdeasQuery($lang: String!, $discussionPhaseId: Int!) {
              ideas(discussionPhaseId: $discussionPhaseId) {
                ... on Idea {
                  id
                  title(lang: $lang)
                  parentId
                  ancestors
                }
              }
              rootIdea(discussionPhaseId: $discussionPhaseId) {
                ... on Idea {
                  id
                }
              }
            }
        """,
        context_value=graphql_request,
        variable_values={"discussionPhaseId": phases['survey'].id, "lang": u"en"})
    assert res.errors is None
    root_idea = res.data['rootIdea']
    assert root_idea['id'] is not None
    assert len(res.data['ideas']) == 1
    first_idea = res.data['ideas'][0]
    assert first_idea['title'] == u'Understanding the dynamics and issues'
    assert first_idea['parentId'] == root_idea['id']
    assert root_idea['id'] in first_idea['ancestors']


def test_graphql_get_all_ideas_with_modified_order(phases, graphql_request,
                               user_language_preference_en_cookie,
                               subidea_1_1_1_1_1, subidea_1_1_1_1_2):
    res = schema.execute(
        u"""query AllIdeasQuery($lang: String!, $discussionPhaseId: Int!) {
            ideas(discussionPhaseId: $discussionPhaseId) {
              ... on Idea {
                id
                title(lang: $lang)
                titleEntries { value, localeCode }
                numPosts
                numContributors
                numChildren(discussionPhaseId: $discussionPhaseId)
                parentId
                order
                posts(first:10) {
                  edges {
                    node {
                      ... on Post { subject body }
                    }
                  }
                }
              }
            }
            rootIdea(discussionPhaseId: $discussionPhaseId) {
              ... on Node {
                id
              }
            }
        }
        """, context_value=graphql_request,
        variable_values={"discussionPhaseId": phases['thread'].id, "lang": u"en"})
    assert [idea['title'] for idea in res.data['ideas']] == [
        u'Favor economic growth',
        u'Lower taxes',
        u'Lower government revenue',
        u'Austerity yields contraction',
        u'Job loss',  # subidea_1_1_1_1_1
        u'Environmental program cuts'  # subidea_1_1_1_1_2
    ]

    subidea_1_1_1_1_2.source_links[0].order = 1.0
    subidea_1_1_1_1_1.source_links[0].order = 2.0
    subidea_1_1_1_1_1.db.flush()
    res = schema.execute(
        u"""query AllIdeasQuery($lang: String!, $discussionPhaseId: Int!) {
            ideas(discussionPhaseId: $discussionPhaseId) {
              ... on Idea {
                id
                title(lang: $lang)
                titleEntries { value, localeCode }
                numPosts
                numContributors
                numChildren(discussionPhaseId: $discussionPhaseId)
                parentId
                order
                posts(first:10) {
                  edges {
                    node {
                      ... on Post { subject body }
                    }
                  }
                }
              }
            }
            rootIdea(discussionPhaseId: $discussionPhaseId) {
              ... on Node {
                id
              }
            }
        }
        """, context_value=graphql_request,
        variable_values={"discussionPhaseId": phases['thread'].id, "lang": u"en"})
    assert [idea['title'] for idea in res.data['ideas']] == [
        u'Favor economic growth',
        u'Lower taxes',
        u'Lower government revenue',
        u'Austerity yields contraction',
        u'Environmental program cuts',  # subidea_1_1_1_1_2
        u'Job loss',  # subidea_1_1_1_1_1
    ]
    # revert the changes for tests isolation
    subidea_1_1_1_1_2.source_links[0].order = 0.0
    subidea_1_1_1_1_1.source_links[0].order = 0.0
    subidea_1_1_1_1_1.db.flush()


def test_graphql_get_direct_ideas_from_root_idea(graphql_request, subidea_1_1_1):
    res = schema.execute(
        u"""query {
            rootIdea {
              ... on Idea {
                  children {
                    ... on Idea {
                        id
                        title
                        titleEntries { value, localeCode }
                        numPosts
                        numContributors
                        parentId
                        order
                        posts(first:10) {
                            edges {
                                node {
                                    ... on Post { subject body } } } } } } } } }
        """, context_value=graphql_request)
    assert len(res.data['rootIdea']['children']) == 1
    assert res.data['rootIdea']['children'][0]['title'] == u'Favor economic growth'


def test_graphql_discussion_counters_survey_phase_no_thematic(graphql_request, phases):
    res = schema.execute(
        u"""query RootIdeaStats($discussionPhaseId: Int) {
              rootIdea(discussionPhaseId: $discussionPhaseId) {
                ... on Node {
                  id
                }
                ... on IdeaInterface {
                  numPosts
                }
              }
              numParticipants
            }
        """, context_value=graphql_request, variable_values={'discussionPhaseId': phases['survey'].id})
    assert res.data['rootIdea'] is None
    assert res.data['numParticipants'] == 2


def test_graphql_discussion_counters_survey_phase_with_proposals(graphql_request, proposals, phases):
    res = schema.execute(
        u"""query RootIdeaStats($discussionPhaseId: Int) {
              rootIdea(discussionPhaseId: $discussionPhaseId) {
                ... on Node {
                  id
                }
                ... on IdeaInterface {
                  numPosts,
                  numTotalPosts
                }
              }
              numParticipants
            }
        """, context_value=graphql_request, variable_values={'discussionPhaseId': phases['survey'].id})
    assert res.data['rootIdea']['id']
    assert res.data['rootIdea']['numTotalPosts'] == 15  # all posts
    assert res.data['rootIdea']['numPosts'] == 0  # total posts per phase is not implemented, because of propagate_message_count this is 0 instead of 15
    assert res.data['numParticipants'] == 2


def test_graphql_discussion_counters_thread_phase(graphql_request, proposals, phases):
    res = schema.execute(
        u"""query RootIdeaStats($discussionPhaseId: Int) {
              rootIdea(discussionPhaseId: $discussionPhaseId) {
                ... on Node {
                  id
                }
                ... on IdeaInterface {
                  numPosts,
                  numTotalPosts
                }
              }
              numParticipants
            }
        """, context_value=graphql_request, variable_values={'discussionPhaseId': phases['thread'].id})
    assert res.data['rootIdea']['id']
    assert res.data['rootIdea']['numTotalPosts'] == 15  # all posts
    assert res.data['rootIdea']['numPosts'] == 15  # phase 1+2 posts counted when current phase is thread
    assert res.data['numParticipants'] == 2


def test_graphql_discussion_counters_thread_phase_deleted_thematic(graphql_request, thematic_and_question, proposals, phases):
    thematic_id, first_question_id = thematic_and_question
    res = schema.execute(
        u"""mutation DeleteThematic($id: ID!) {
              deleteThematic(thematicId: $id) {
                success
              }
            }
        """, context_value=graphql_request, variable_values={'id': thematic_id})
    assert res.errors is None
    assert res.data['deleteThematic']['success'] is True
    res = schema.execute(
        u"""query RootIdeaStats($discussionPhaseId: Int) {
              rootIdea(discussionPhaseId: $discussionPhaseId) {
                ... on Node {
                  id
                }
                ... on IdeaInterface {
                  numPosts,
                  numTotalPosts
                }
              }
              numParticipants
            }
        """, context_value=graphql_request, variable_values={'discussionPhaseId': phases['thread'].id})
    assert res.data['rootIdea']['id']
    assert res.data['rootIdea']['numTotalPosts'] == 15  # all posts
    # But the posts are not bound anymore
    assert res.data['rootIdea']['numPosts'] == 0
    assert res.data['numParticipants'] == 2


def test_graphql_discussion_counters_thread_phase_with_posts(graphql_request, proposals, top_post_in_thread_phase, phases):
    res = schema.execute(
        u"""query RootIdeaStats($discussionPhaseId: Int) {
              rootIdea(discussionPhaseId: $discussionPhaseId) {
                ... on Node {
                  id
                }
                ... on IdeaInterface {
                  numPosts,
                  numTotalPosts
                }
              }
              numParticipants
            }
        """, context_value=graphql_request, variable_values={'discussionPhaseId': phases['thread'].id})
    assert res.data['rootIdea']['id']
    assert res.data['rootIdea']['numTotalPosts'] == 16  # all posts
    assert res.data['rootIdea']['numPosts'] == 16  # phase 1+2 posts counted when current phase is thread
    # 16 because thread phase is on discussion.root_idea and survey phase is a sub root idea of it.
    assert res.data['numParticipants'] == 2


def test_graphql_discussion_counters_all_phases(graphql_request, proposals, top_post_in_thread_phase, phases):
    res = schema.execute(
        u"""query RootIdeaStats($discussionPhaseId: Int) {
              rootIdea(discussionPhaseId: $discussionPhaseId) {
                ... on Node {
                  id
                }
                ... on IdeaInterface {
                  numPosts,
                  numTotalPosts
                }
              }
              numParticipants
            }
        """, context_value=graphql_request, variable_values={'discussionPhaseId': None})
    assert res.data['rootIdea']['id']
    assert res.data['rootIdea']['numTotalPosts'] == 16  # all posts
    assert res.data['rootIdea']['numPosts'] == 16  # phase 1+2 posts counted because all posts come from discussion.root_idea
    assert res.data['numParticipants'] == 2

def test_graphql_total_vote_session_participations_zero_vote(graphql_request, proposals, phases):
    res = schema.execute(
        u"""query RootIdeaStats {
              totalVoteSessionParticipations
            }
        """, context_value=graphql_request)
    assert res.errors is None
    assert res.data['totalVoteSessionParticipations'] == 0

def test_graphql_total_vote_session_participations_4_votes(graphql_request, phases, graphql_participant1_request, vote_session, vote_proposal, token_vote_spec_with_votes, gauge_vote_specification_with_votes, graphql_registry):
    res = schema.execute(
        u"""query RootIdeaStats {
              totalVoteSessionParticipations
            }
        """, context_value=graphql_request)
    assert res.errors is None
    assert res.data['totalVoteSessionParticipations'] == 4

def test_get_long_title_on_idea(graphql_request, idea_in_thread_phase):
    # This is the "What you need to know"
    idea_id = idea_in_thread_phase
    from graphene.relay import Node
    raw_id = int(Node.from_global_id(idea_id)[1])
    from assembl.models import Idea, LangString
    idea = Idea.get(raw_id)
    idea.synthesis_title = LangString.create(u'What you need to know', 'en')
    idea.db.flush()
    res = schema.execute(u"""
query Idea($lang: String!, $id: ID!) {
  idea: node(id: $id) {
    ... on Idea {
      title(lang: $lang)
      synthesisTitle(lang: $lang)
      description(lang: $lang)
      img {
        externalUrl
      }
    }
  }
}
""", context_value=graphql_request, variable_values={
        "id": idea_id,
        "lang": u'en',
    })
    assert json.loads(json.dumps(res.data)) == {
        u'idea': {
            u'title': u'Understanding the dynamics and issues',
            u'synthesisTitle': u'What you need to know',
            u'description': u'',
            u"img": None
        }
    }


def test_extracts_on_post(admin_user, graphql_request, discussion, top_post_in_thread_phase):
    from graphene.relay import Node
    raw_id = int(Node.from_global_id(top_post_in_thread_phase)[1])
    from assembl.models import Extract, Post
    post = Post.get(raw_id)
    post.extracts.append(
        Extract(body=u"super quote", important=False,
                creator=admin_user, owner=admin_user, discussion=discussion,
                extract_hash=u"extract1"))
    post.extracts.append(
        Extract(body=u"super important quote", important=True,
                creator=admin_user, owner=admin_user, discussion=discussion,
                extract_hash=u"extract2"))
    post.db.flush()
    res = schema.execute(u"""
query Post($id: ID!) {
  post: node(id: $id) {
    ... on Post {
      extracts {
        body
        important
      }
    }
  }
}
""", context_value=graphql_request, variable_values={
        "id": top_post_in_thread_phase,
    })
    assert json.loads(json.dumps(res.data)) == {
        u'post': {
            u'extracts': [
                {u'body': u'super quote',
                 u'important': False},
                {u'body': u'super important quote',
                 u'important': True},
                ]
            }}


def test_extract_get_comment(admin_user, graphql_request, top_post_in_thread_phase, extract_post_1_to_subidea_1_1, extract_comment):
    from graphene.relay import Node
    raw_id = int(Node.from_global_id(top_post_in_thread_phase)[1])
    from assembl.models import Post
    post = Post.get(raw_id)
    post.extracts.append(extract_post_1_to_subidea_1_1)
    post.db.flush()

    res = schema.execute(u"""
        query Post($id: ID!, $lang: String!) {
          post: node(id: $id) {
            ... on Post {
              extracts {
                comments {
                  subject(lang: $lang)
                }
              }
            }
          }
        }
    """, context_value=graphql_request, variable_values={
            "id": top_post_in_thread_phase,
            "lang": u'en',
        })

    assert res.data['post']['extracts'][0]['comments'][0]['subject'] == 'comment of extract title'


def test_extract_get_comment_with_reply(admin_user, graphql_request, top_post_in_thread_phase, extract_post_1_to_subidea_1_1,
                                        extract_comment, extract_comment_reply):
    from graphene.relay import Node
    raw_id = int(Node.from_global_id(top_post_in_thread_phase)[1])
    from assembl.models import Post
    post = Post.get(raw_id)
    post.extracts.append(extract_post_1_to_subidea_1_1)
    post.db.flush()

    res = schema.execute(u"""
        query Post($id: ID!, $lang: String!) {
          post: node(id: $id) {
            ... on Post {
              extracts {
                comments {
                  subject(lang: $lang)
                  parentId
                }
              }
            }
          }
        }
    """, context_value=graphql_request, variable_values={
            "id": top_post_in_thread_phase,
            "lang": u'en',
        })

    assert res.data['post']['extracts'][0]['comments'][0]['subject'] == 'comment of extract title'
    assert res.data['post']['extracts'][0]['comments'][0]['parentId'] == None
    assert res.data['post']['extracts'][0]['comments'][1]['subject'] == 'reply of comment of extract title'
    assert res.data['post']['extracts'][0]['comments'][1]['parentId'] == extract_comment.graphene_id()


def test_announcement_on_idea(graphql_request, announcement_en_fr):
    node_id = announcement_en_fr.idea.graphene_id()
    res = schema.execute(u"""
query Idea($id: ID!, $lang: String!){
    idea: node(id: $id) {
        ... on Idea {
            announcement {
                title(lang: $lang)
                body(lang: $lang)
                summary(lang: $lang)
            }
        }
    }
}""", context_value=graphql_request, variable_values={
        "id": node_id,
        "lang": "en"
    })
    assert json.loads(json.dumps(res.data)) == {
        u'idea': {
            u'announcement': {
                u'title': u"Announce title in English",
                u'body': u"Announce body in English",
                u'summary': u'Announce summary in English'
            }
        }
    }


def test_no_announcement_on_ideas(graphql_request, idea_with_en_fr):
    node_id = idea_with_en_fr.graphene_id()
    res = schema.execute(u"""
query Idea($id: ID!, $lang: String!){
    idea: node(id: $id) {
        ... on Idea {
            announcement {
                title(lang: $lang)
                body(lang: $lang)
            }
        }
    }
}""", context_value=graphql_request, variable_values={
        "id": node_id,
        "lang": "en"
    })
    assert json.loads(json.dumps(res.data)) == {
        u'idea': {
            u'announcement': None
        }
    }


def test_graphql_get_question(graphql_request, thematic_and_question):
    node_id = thematic_and_question[1]
    res = schema.execute(u"""
query Question($lang: String!, $id: ID!) {
  question: node(id: $id) {
    ... on Question {
      title(lang: $lang)
      id
      parent {
        ... on IdeaInterface {
          title(lang: $lang)
          img {
            externalUrl
            mimeType
          }
        }
        ... on Idea {
          id
        }
      }
    }
  }
}
""", context_value=graphql_request, variable_values={
        "id": node_id,
        "lang": "en"
    })

    assert res.errors is None
    assert json.loads(json.dumps(res.data)) == {
        u'question': {
            u'parent': {
                u'id': thematic_and_question[0],
                u'img': None,
                u'title': u'Understanding the dynamics and issues'
                },
            u'id': node_id,
            u'title': u"Comment qualifiez-vous l'emergence de l'Intelligence Artificielle dans notre société ?"
            }
    }


def test_graphql_get_question_posts(graphql_request, graphql_registry, thematic_and_question, proposals):
    node_id = thematic_and_question[1]
    len_proposals = len(proposals) - 4
    res = schema.execute(
        graphql_registry['QuestionPostsQuery'],
        context_value=graphql_request,
        variable_values={
            "id": node_id,
            "first": len_proposals,
            "after": "",
            "isModerating": False
        }
    )
    assert res.errors is None
    assert 'question' in res.data and 'posts' in res.data['question'] and 'edges' in res.data['question']['posts']
    question_posts = res.data['question']['posts']['edges']
    assert len(question_posts) == len_proposals
    assert all(post['node']['id'] in proposals for post in question_posts)


def test_graphql_get_question_pending_posts(graphql_request, graphql_registry, thematic_and_question, proposals):
    node_id = thematic_and_question[1]
    res = schema.execute(
        graphql_registry['QuestionPostsQuery'],
        context_value=graphql_request,
        variable_values={
            "id": node_id,
            "first": len(proposals),
            "after": "",
            "isModerating": True
        }
    )
    assert res.errors is None
    assert 'question' in res.data and 'posts' in res.data['question'] and 'edges' in res.data['question']['posts']
    pending_posts = res.data['question']['posts']['edges']
    assert len(pending_posts) == 5
    assert all(post['node']['id'] in proposals for post in pending_posts)


def test_graphql_create_bright_mirror(graphql_request, graphql_registry, test_session, phases):
    import os
    from io import BytesIO

    class FieldStorage(object):
        file = BytesIO(os.urandom(16))
        filename = u'path/to/img.png'
        type = 'image/png'

    graphql_request.POST['variables.img'] = FieldStorage()

    res = schema.execute(
        graphql_registry['createThematic'],
        context_value=graphql_request,
        variable_values={
            'discussionPhaseId': phases['brightMirror'].id,
            'messageViewOverride': 'brightMirror',
            'titleEntries': [
                {'value': u"Comprendre les dynamiques et les enjeux", 'localeCode': u"fr"},
                {'value': u"Understanding the dynamics and issues", 'localeCode': u"en"}
            ],
            'descriptionEntries': [
                {'value': u"Desc FR", 'localeCode': u"fr"},
                {'value': u"Desc EN", 'localeCode': u"en"}
            ],
            'image': u'variables.img',
            'announcement': {
                'titleEntries': [
                    {'value': u"Title FR announce", 'localeCode': u"fr"},
                    {'value': u"Title EN announce", 'localeCode': u"en"}
                ],
                'bodyEntries': [
                    {'value': u"Body FR announce", 'localeCode': u"fr"},
                    {'value': u"Body EN announce", 'localeCode': u"en"}
                ]
            }
        })
    assert res.errors is None
    idea = res.data['createThematic']['thematic']
    assert idea['announcement'] == {
        u'title': u'Title EN announce',
        u'body': u'Body EN announce',
        u'summary': None
    }
    assert idea['title'] == u'Understanding the dynamics and issues'
    assert idea['description'] == u'Desc EN'
    assert idea['img'] is not None
    assert 'externalUrl' in idea['img']
    assert idea['messageViewOverride'] == u'brightMirror'
    assert idea['order'] == 1.0
    raw_id = int(from_global_id(idea['id'])[1])
    test_session.delete(models.Idea.get(raw_id))
    test_session.flush()


def test_graphql_create_bright_mirror_no_title(phases, graphql_request, graphql_registry, test_session):
    import os
    from io import BytesIO

    class FieldStorage(object):
        file = BytesIO(os.urandom(16))
        filename = u'path/to/img.png'
        type = 'image/png'

    graphql_request.POST['variables.img'] = FieldStorage()

    res = schema.execute(
        graphql_registry['createThematic'],
        context_value=graphql_request,
        variable_values={
            'discussionPhaseId': phases['brightMirror'].id,
            'messageViewOverride': 'brightMirror',
            'titleEntries': None,
            'descriptionEntries': [
                {'value': u"Desc FR", 'localeCode': u"fr"},
                {'value': u"Desc EN", 'localeCode': u"en"}
            ],
            'image': u'variables.img',
            'announcement': {
                'titleEntries': [
                    {'value': u"Title FR announce", 'localeCode': u"fr"},
                    {'value': u"Title EN announce", 'localeCode': u"en"}
                ],
                'bodyEntries': [
                    {'value': u"Body FR announce", 'localeCode': u"fr"},
                    {'value': u"Body EN announce", 'localeCode': u"en"}
                ]
            }
        })

    assert 'Variable "$titleEntries" of required type "[LangStringEntryInput]!" was not provided.' == res.errors[0].args[0]


def test_graphql_create_bright_mirror_empty_title(phases, graphql_request, graphql_registry, test_session):
    import os
    from io import BytesIO

    class FieldStorage(object):
        file = BytesIO(os.urandom(16))
        filename = u'path/to/img.png'
        type = 'image/png'

    graphql_request.POST['variables.img'] = FieldStorage()

    res = schema.execute(
        graphql_registry['createThematic'],
        context_value=graphql_request,
        variable_values={
            'discussionPhaseId': phases['brightMirror'].id,
            'messageViewOverride': 'brightMirror',
            'titleEntries': [],
            'descriptionEntries': [
                {'value': u"Desc FR", 'localeCode': u"fr"},
                {'value': u"Desc EN", 'localeCode': u"en"}
            ],
            'image': u'variables.img',
            'announcement': {
                'titleEntries': [
                    {'value': u"Title FR announce", 'localeCode': u"fr"},
                    {'value': u"Title EN announce", 'localeCode': u"en"}
                ],
                'bodyEntries': [
                    {'value': u"Body FR announce", 'localeCode': u"fr"},
                    {'value': u"Body EN announce", 'localeCode': u"en"}
                ]
            }
        })

    assert "titleEntries needs at least one entry" in res.errors[0].args[0]


def test_graphql_create_bright_mirror_announcement_empty_title(phases, graphql_request, graphql_registry, test_session):
    import os
    from io import BytesIO

    class FieldStorage(object):
        file = BytesIO(os.urandom(16))
        filename = u'path/to/img.png'
        type = 'image/png'

    graphql_request.POST['variables.img'] = FieldStorage()

    res = schema.execute(
        graphql_registry['createThematic'],
        context_value=graphql_request,
        variable_values={
            'discussionPhaseId': phases['brightMirror'].id,
            'messageViewOverride': 'brightMirror',
            'titleEntries': [
                {'value': u"Comprendre les dynamiques et les enjeux", 'localeCode': u"fr"},
                {'value': u"Understanding the dynamics and issues", 'localeCode': u"en"}
            ],
            'descriptionEntries': [
                {'value': u"Desc FR", 'localeCode': u"fr"},
                {'value': u"Desc EN", 'localeCode': u"en"}
            ],
            'image': u'variables.img',
            'announcement': {
                'titleEntries': [],
                'bodyEntries': [
                    {'value': u"Body FR announce", 'localeCode': u"fr"},
                    {'value': u"Body EN announce", 'localeCode': u"en"}
                ],
                'quoteEntries': [
                    {'value': u"Body FR quote", 'localeCode': u"fr"},
                    {'value': u"Body EN quote", 'localeCode': u"en"}
                ]
            }
        })

    assert "Announcement titleEntries needs at least one entry" in res.errors[0].args[0]


def test_graphql_get_bright_mirror(graphql_request, graphql_registry, bright_mirror, test_session, phases):
    res = schema.execute(
        graphql_registry['ThematicsQuery'],
        context_value=graphql_request,
        variable_values={'discussionPhaseId': phases['brightMirror'].id}
        )

    assert res.errors is None
    assert len(res.data['thematics']) == 1
    result = json.loads(json.dumps(res.data))
    idea = result['thematics'][0]
    assert sorted(idea['announcement']['titleEntries'], key=lambda e: e['localeCode']) == [
        {'value': u"Title EN announce", 'localeCode': u"en"},
        {'value': u"Title FR announce", 'localeCode': u"fr"}
    ]
    assert sorted(idea['announcement']['bodyEntries'], key=lambda e: e['localeCode']) == [
        {'value': u"Body EN announce", 'localeCode': u"en"},
        {'value': u"Body FR announce", 'localeCode': u"fr"}
    ]
    assert sorted(idea['titleEntries'], key=lambda e: e['localeCode']) == [
        {'value': u"Understanding the dynamics and issues", 'localeCode': u"en"},
        {'value': u"Comprendre les dynamiques et les enjeux", 'localeCode': u"fr"}
    ]
    assert sorted(idea['descriptionEntries'], key=lambda e: e['localeCode']) == [
        {'value': u"Desc EN", 'localeCode': u"en"},
        {'value': u"Desc FR", 'localeCode': u"fr"}
    ]
    assert idea['img'] is not None
    assert 'externalUrl' in idea['img']
    assert idea['messageViewOverride'] == u'brightMirror'
    assert idea['order'] == 1.0


def test_graphql_get_bright_mirror_noresult(phases, graphql_request, graphql_registry):
    res = schema.execute(
        graphql_registry['ThematicsQuery'],
        context_value=graphql_request,
        variable_values={'discussionPhaseId': phases['brightMirror'].id}
        )

    assert res.errors is None
    assert len(res.data['thematics']) == 0


def test_graphql_bright_mirror_should_get_only_published_posts(graphql_request, graphql_registry, bright_mirror,
                                                        post_published_for_bright_mirror,
                                                        post_draft_for_bright_mirror, test_session,
                                                        post_published_for_bright_mirror_participant):

    res = schema.execute(u"""
        query Idea($id: ID!) {
            idea: node(id: $id) {
                ... on Idea {
                    numPosts
                    posts {
                        edges {
                            node {
                                ... on Post { subject }
                            }
                        }
                    }
                }
            }
        }
      """, context_value=graphql_request, variable_values={
        "id": bright_mirror,
        })
    assert json.loads(json.dumps(res.data)) == {
        u'idea': {
            u'numPosts': 2,
            u'posts': {
                u'edges': [
                    {
                        u'node': {
                            u'subject': u'Published by participant'
                        }
                    },
                    {
                        u'node': {
                            u'subject': u'Published'
                        }
                    }
                ]
            }
        }
    }


def test_graphql_bright_mirror_should_get_all_posts_of_user_draft_first(graphql_request, graphql_registry, bright_mirror,
                                                        post_published_for_bright_mirror, admin_user,
                                                        post_draft_for_bright_mirror, test_session,
                                                        post_published_for_bright_mirror_participant):
    post_published_for_bright_mirror.creator = admin_user
    post_published_for_bright_mirror.db.flush()
    post_draft_for_bright_mirror.creator = admin_user
    post_draft_for_bright_mirror.db.flush()

    res = schema.execute(u"""
        query Idea($id: ID!) {
            idea: node(id: $id) {
                ... on Idea {
                    numPosts
                    posts {
                        edges {
                            node {
                                ... on Post { subject }
                            }
                        }
                    }
                }
            }
        }
      """, context_value=graphql_request, variable_values={
        "id": bright_mirror,
        })
    assert json.loads(json.dumps(res.data)) == {
        u'idea': {
            u'numPosts': 2,
            u'posts': {
                u'edges': [
                    {
                        u'node': {
                            u'subject': u'Published by participant'
                        }
                    },
                    {
                        u'node': {
                            u'subject': u'Published'
                        }
                    },
                    {
                        u'node': {
                            u'subject': u'Draft'
                        }
                    }
                ]
            }
        }
    }

def test_mutation_update_ideas_multicol_create_two_columns_with_empty_message_classifier(test_session, graphql_request, graphql_registry, phases):
    test_session.commit()
    res = schema.execute(
        graphql_registry['updateIdeas'],
        context_value=graphql_request,
        variable_values={
            'discussionPhaseId': phases['multiColumns'].id,
            'ideas': [{
                'messageViewOverride': 'messageColumns',
                'titleEntries': [
                    {'value': u"Comprendre les dynamiques et les enjeux", 'localeCode': u"fr"},
                    {'value': u"Understanding the dynamics and issues", 'localeCode': u"en"}
                ],
                'descriptionEntries': [
                    {'value': u"Desc FR", 'localeCode': u"fr"},
                    {'value': u"Desc EN", 'localeCode': u"en"}
                ],
                'messageColumns': [
                    {'nameEntries': [{'value': u"Premier entrée pour le nom", "localeCode": u"fr"}],
                    'titleEntries': [{'value': u"Premier titre pour le multicolonne", "localeCode": u"fr"}],
                    'color': 'red',
                    'columnSynthesisSubject': [
                        {'value': u"Titre de Synthèse de colonne en français pour colonne positive", 'localeCode': u"fr"},
                        {'value': u"Title of Column Synthesis in english for positive column", 'localeCode': u"en"}
                    ],
                    'columnSynthesisBody': [
                        {'value': u"Synthèse de colonne en français for positive column", 'localeCode': u"fr"},
                        {'value': u"Column Synthesis in english for positive column", 'localeCode': u"en"}
                    ]
                    },
                    {'nameEntries': [{'value': u"Deuxième entrée pour le nom", "localeCode": u"fr"}],
                    'titleEntries': [{'value': u"Deuxième titre pour le multicolonne", "localeCode": u"fr"}],
                    'color': 'green',
                    'columnSynthesisSubject': [
                        {'value': u"Titre de Synthèse de colonne en français pour colonne négative", 'localeCode': u"fr"},
                        {'value': u"Title of Column Synthesis in english for negative column", 'localeCode': u"en"}
                    ],
                    'columnSynthesisBody': [
                        {'value': u"Synthèse de colonne en français for negative column", 'localeCode': u"fr"},
                        {'value': u"Column Synthesis in english for negative column", 'localeCode': u"en"}
                    ]
                    }
                ],
                'announcement': {
                    'titleEntries': [
                        {'value': u"Title FR announce", 'localeCode': u"fr"},
                        {'value': u"Title EN announce", 'localeCode': u"en"}
                    ],
                    'bodyEntries': [
                        {'value': u"Body FR announce", 'localeCode': u"fr"},
                        {'value': u"Body EN announce", 'localeCode': u"en"}
                    ]
                }
            }]
        })
    assert res.errors is None
    created_idea_global_id = res.data['updateIdeas']['query']['thematics'][0]['id']
    created_idea = test_session.query(models.Idea).get(int(from_global_id(created_idea_global_id)[1]))
    assert created_idea.message_columns[0].message_classifier == u'column1'
    assert created_idea.message_columns[1].message_classifier == u'column2'
    assert created_idea.message_columns[0].color == 'red'
    assert created_idea.message_columns[1].color == 'green'
    test_session.rollback()


def create_idea_thread(graphql_request, graphql_registry, phases):
    res = schema.execute(
        graphql_registry['updateIdeas'],
        context_value=graphql_request,
        variable_values={
            'discussionPhaseId': phases['brightMirror'].id,
            'ideas': [{
                'messageViewOverride': 'thread',
                'titleEntries': [
                    {'value': u"Comprendre les dynamiques et les enjeux", 'localeCode': u"fr"},
                    {'value': u"Understanding the dynamics and issues", 'localeCode': u"en"}
                ],
                'descriptionEntries': [
                    {'value': u"Desc FR", 'localeCode': u"fr"},
                    {'value': u"Desc EN", 'localeCode': u"en"}
                ],
                'announcement': {
                    'titleEntries': [
                        {'value': u"Title FR announce", 'localeCode': u"fr"},
                        {'value': u"Title EN announce", 'localeCode': u"en"}
                    ],
                    'bodyEntries': [
                        {'value': u"Body FR announce", 'localeCode': u"fr"},
                        {'value': u"Body EN announce", 'localeCode': u"en"}
                    ]
                }
            }]
        })
    return res


def create_idea(graphql_request, graphql_registry, phases):
    res = schema.execute(
        graphql_registry['updateIdeas'],
        context_value=graphql_request,
        variable_values={
            'discussionPhaseId': phases['multiColumns'].id,
            'ideas': [{
                'messageViewOverride': 'messageColumns',
                'titleEntries': [
                    {'value': u"Comprendre les dynamiques et les enjeux", 'localeCode': u"fr"},
                    {'value': u"Understanding the dynamics and issues", 'localeCode': u"en"}
                ],
                'descriptionEntries': [
                    {'value': u"Desc FR", 'localeCode': u"fr"},
                    {'value': u"Desc EN", 'localeCode': u"en"}
                ],
                'messageColumns': [
                    {'nameEntries': [{'value': u"Premier entrée pour le nom", "localeCode": u"fr"}],
                    'titleEntries': [{'value': u"Premier titre pour le multicolonne", "localeCode": u"fr"}],
                    'color': 'red',
                    'messageClassifier': 'positive',
                    'columnSynthesisSubject': [
                        {'value': u"Titre de Synthèse de colonne en français pour colonne positive", 'localeCode': u"fr"},
                        {'value': u"Title of Column Synthesis in english for positive column", 'localeCode': u"en"}
                    ],
                    'columnSynthesisBody': [
                        {'value': u"Synthèse de colonne en français for positive column", 'localeCode': u"fr"},
                        {'value': u"Column Synthesis in english for positive column", 'localeCode': u"en"}
                    ]},
                    {'nameEntries': [{'value': u"Deuxième entrée pour le nom", "localeCode": u"fr"}],
                    'titleEntries': [{'value': u"Deuxième titre pour le multicolonne", "localeCode": u"fr"}],
                    'color': 'green',
                    'messageClassifier': 'negative',
                    'columnSynthesisSubject': [
                        {'value': u"Titre de Synthèse de colonne en français pour colonne négative", 'localeCode': u"fr"},
                        {'value': u"Title of Column Synthesis in english for negative column", 'localeCode': u"en"}
                    ],
                    'columnSynthesisBody': [
                        {'value': u"Synthèse de colonne en français for negative column", 'localeCode': u"fr"},
                        {'value': u"Column Synthesis in english for negative column", 'localeCode': u"en"}
                    ]}
                ],
                'announcement': {
                    'titleEntries': [
                        {'value': u"Title FR announce", 'localeCode': u"fr"},
                        {'value': u"Title EN announce", 'localeCode': u"en"}
                    ],
                    'bodyEntries': [
                        {'value': u"Body FR announce", 'localeCode': u"fr"},
                        {'value': u"Body EN announce", 'localeCode': u"en"}
                    ]
                }
            }]
        })
    return res


def test_mutation_update_ideas_multicol_create_two_columns(test_session, graphql_request, graphql_registry, phases):
    test_session.commit()
    res = create_idea(graphql_request, graphql_registry, phases)
    assert res.errors is None
    created_idea_global_id = res.data['updateIdeas']['query']['thematics'][0]['id']
    created_idea = test_session.query(models.Idea).get(int(from_global_id(created_idea_global_id)[1]))
    assert len(created_idea.message_columns) == 2
    first_column = created_idea.message_columns[0]
    second_column = created_idea.message_columns[1]
    assert first_column.message_classifier == 'positive'
    assert second_column.message_classifier == 'negative'
    assert first_column.color == 'red'
    assert second_column.color == 'green'
    assert first_column.get_positional_index() == 0
    assert second_column.get_positional_index() == 1
    assert first_column.name.entries[0].value == u"Premier entrée pour le nom"
    assert first_column.title.entries[0].value == u"Premier titre pour le multicolonne"
    assert second_column.name.entries[0].value == u"Deuxième entrée pour le nom"
    assert second_column.title.entries[0].value == u"Deuxième titre pour le multicolonne"
    first_synthesis = first_column.get_column_synthesis()
    second_synthesis = second_column.get_column_synthesis()
    assert {e.locale_code: e.value for e in first_synthesis.subject.entries} == {
        u'fr': u'Titre de Synthèse de colonne en français pour colonne positive',
        u'en': u'Title of Column Synthesis in english for positive column'}
    assert {e.locale_code: e.value for e in first_synthesis.body.entries} == {
        u'fr': u'Synthèse de colonne en français for positive column',
        u'en': u'Column Synthesis in english for positive column'}
    assert {e.locale_code: e.value for e in second_synthesis.subject.entries} == {
        u'fr': u'Titre de Synthèse de colonne en français pour colonne négative',
        u'en': u'Title of Column Synthesis in english for negative column'}
    assert {e.locale_code: e.value for e in second_synthesis.body.entries} == {
        u'fr': u'Synthèse de colonne en français for negative column',
        u'en': u'Column Synthesis in english for negative column'}
    test_session.rollback()


@freeze_time("2018-7-1")
def test_mutation_update_ideas_change_module_type(test_session, graphql_request, graphql_registry, phases):
    test_session.commit()
    res = create_idea_thread(graphql_request, graphql_registry, phases)
    assert res.errors is None
    created_idea_global_id = res.data['updateIdeas']['query']['thematics'][0]['id']
    created_idea = test_session.query(models.Idea).get(int(from_global_id(created_idea_global_id)[1]))
    created_post = create_post(graphql_request, graphql_registry, created_idea, phases)
    assert created_post.errors is None
    # The PostPathGlobalCollection object attached to DiscussionGlobalData on graphql_request.discussion_data
    # contains old posts counters before the creation of the idea.
    # Removing the cache will recreate the counters so that the `assert len(posts) == 1` pass.
    graphql_request.discussion_data = None
    related = created_idea.get_related_posts_query(True, include_moderating=False)
    query = models.Post.query.join(
        related, models.Post.id == related.c.post_id
        )
    posts = query.all()
    assert len(posts) == 1
    updated_idea = schema.execute(
                graphql_registry['updateIdeas'],
                context_value = graphql_request,
                variable_values={
                'discussionPhaseId': phases['brightMirror'].id,
                'ideas': [{
                    'id': created_idea_global_id,
                    'messageViewOverride': 'brightMirror',
                    'titleEntries': [
                        {'value': u"Comprendre les dynamiques et les enjeux", 'localeCode': u"fr"},
                        {'value': u"Understanding the dynamics and issues", 'localeCode': u"en"}
                    ]}
                ]}
                )
    assert updated_idea.errors is None
    related = created_idea.get_related_posts_query(True, include_moderating=False)
    query = models.Post.query.join(
        related, models.Post.id == related.c.post_id
        )
    posts = query.all()
    assert len(posts) == 0
    test_session.rollback()


def create_post(graphql_request, graphql_registry, idea, phases):
    res = schema.execute(
        graphql_registry['createPost'],
        context_value=graphql_request,
        variable_values={
        'subject': 'subject of the post',
        'contentLocale': 'fr',
        'body': "body of the test post",
        'ideaId': to_global_id("Idea", idea.id)
        })
    return res


def test_mutation_update_ideas_multicol_add_neutral_column(test_session, graphql_request, graphql_registry, phases):
    test_session.commit()
    res = create_idea(graphql_request, graphql_registry, phases)
    assert res.errors is None
    created_idea_global_id = res.data['updateIdeas']['query']['thematics'][0]['id']
    created_idea = test_session.query(models.Idea).get(int(from_global_id(created_idea_global_id)[1]))
    res = schema.execute(
        graphql_registry['updateIdeas'],
        context_value=graphql_request,
        variable_values={
            'discussionPhaseId': phases['multiColumns'].id,
            'ideas': [{
                'id': created_idea_global_id,
                'messageViewOverride': 'messageColumns',
                'titleEntries': [
                    {'value': u"Comprendre les dynamiques et les enjeux", 'localeCode': u"fr"},
                    {'value': u"Understanding the dynamics and issues", 'localeCode': u"en"}
                ],
                'descriptionEntries': [
                    {'value': u"Desc FR", 'localeCode': u"fr"},
                    {'value': u"Desc EN", 'localeCode': u"en"}
                ],
                'messageColumns': [
                    {'nameEntries': [{'value': u"Premier entrée pour le nom", "localeCode": u"fr"}],
                    'titleEntries': [{'value': u"Premier titre pour le multicolonne", "localeCode": u"fr"}],
                    'color': 'red',
                    'messageClassifier': 'positive',
                    'columnSynthesisSubject': [
                        {'value': u"Titre de Synthèse de colonne en français pour colonne positive", 'localeCode': u"fr"},
                        {'value': u"Title of Column Synthesis in english for positive column", 'localeCode': u"en"}
                    ],
                    'columnSynthesisBody': [
                        {'value': u"Synthèse de colonne en français for positive column", 'localeCode': u"fr"},
                        {'value': u"Column Synthesis in english for positive column", 'localeCode': u"en"}
                    ]},
                    {'nameEntries': [{'value': u"Deuxième entrée pour le nom", "localeCode": u"fr"}],
                    'titleEntries': [{'value': u"Deuxième titre pour le multicolonne", "localeCode": u"fr"}],
                    'color': 'green',
                    'messageClassifier': 'negative',
                    'columnSynthesisSubject': [
                        {'value': u"Titre de Synthèse de colonne en français pour colonne négative", 'localeCode': u"fr"},
                        {'value': u"Title of Column Synthesis in english for negative column", 'localeCode': u"en"}
                    ],
                    'columnSynthesisBody': [
                        {'value': u"Synthèse de colonne en français for negative column", 'localeCode': u"fr"},
                        {'value': u"Column Synthesis in english for negative column", 'localeCode': u"en"}
                    ]},
                    {'nameEntries': [{'value': u"troisième entrée pour le nom", "localeCode": u"fr"}],
                    'titleEntries': [{'value': u"troisième titre pour le multicolonne", "localeCode": u"fr"}],
                    'color': 'blue',
                    'messageClassifier': 'neutral',
                    'columnSynthesisSubject': [
                        {'value': u"Titre de Synthèse de colonne en français pour colonne neutre", 'localeCode': u"fr"},
                        {'value': u"Title of Column Synthesis in english for neutral column", 'localeCode': u"en"}
                    ],
                    'columnSynthesisBody': [
                        {'value': u"Synthèse de colonne en français for neutral column", 'localeCode': u"fr"},
                        {'value': u"Column Synthesis in english for neutral column", 'localeCode': u"en"}
                    ]}
                ],
                'announcement': {
                    'titleEntries': [
                        {'value': u"Title FR announce", 'localeCode': u"fr"},
                        {'value': u"Title EN announce", 'localeCode': u"en"}
                    ],
                    'bodyEntries': [
                        {'value': u"Body FR announce", 'localeCode': u"fr"},
                        {'value': u"Body EN announce", 'localeCode': u"en"}
                    ]
                }
            }]
        })
    assert res.errors is None
    created_idea_global_id = res.data['updateIdeas']['query']['thematics'][0]['id']
    created_idea = test_session.query(models.Idea).get(int(from_global_id(created_idea_global_id)[1]))
    assert len(created_idea.message_columns) == 3
    assert created_idea.message_columns[0].message_classifier == 'positive'
    assert created_idea.message_columns[1].message_classifier == 'negative'
    assert created_idea.message_columns[2].message_classifier == "neutral"
    assert created_idea.message_columns[0].color == 'red'
    assert created_idea.message_columns[1].color == 'green'
    assert created_idea.message_columns[2].color == 'blue'
    test_session.rollback()


def test_mutation_update_ideas_multicol_update_first_column(test_session, graphql_request, graphql_registry, phases):
    test_session.commit()
    res = create_idea(graphql_request, graphql_registry, phases)
    assert res.errors is None
    created_idea_global_id = res.data['updateIdeas']['query']['thematics'][0]['id']
    created_idea = test_session.query(models.Idea).get(int(from_global_id(created_idea_global_id)[1]))
    res = schema.execute(
        graphql_registry['updateIdeas'],
        context_value=graphql_request,
        variable_values={
            'discussionPhaseId': phases['multiColumns'].id,
            'ideas': [{
                'id': created_idea_global_id,
                'messageViewOverride': 'messageColumns',
                'titleEntries': [
                    {'value': u"Comprendre les dynamiques et les enjeux", 'localeCode': u"fr"},
                    {'value': u"Understanding the dynamics and issues", 'localeCode': u"en"}
                ],
                'descriptionEntries': [
                    {'value': u"Desc FR", 'localeCode': u"fr"},
                    {'value': u"Desc EN", 'localeCode': u"en"}
                ],
                'messageColumns': [
                    {'nameEntries': [{'value': u"Premier entrée pour le nom modifié", "localeCode": u"fr"}],
                    'titleEntries': [{'value': u"Premier titre pour le multicolonne modifié", "localeCode": u"fr"}],
                    'color': 'orange',
                    'messageClassifier': 'positive',
                    'columnSynthesisSubject': [
                        {'value': u"Titre de Synthèse de colonne en français pour colonne positive modifié", 'localeCode': u"fr"},
                        {'value': u"Title of Column Synthesis in english for positive column modified", 'localeCode': u"en"}
                    ],
                    'columnSynthesisBody': [
                        {'value': u"Synthèse de colonne en français for positive column modifié", 'localeCode': u"fr"},
                        {'value': u"Column Synthesis in english for positive column modified", 'localeCode': u"en"}
                    ]},
                    {'nameEntries': [{'value': u"Deuxième entrée pour le nom", "localeCode": u"fr"}],
                    'titleEntries': [{'value': u"Deuxième titre pour le multicolonne", "localeCode": u"fr"}],
                    'color': 'green',
                    'messageClassifier': 'negative',
                    'columnSynthesisSubject': [
                        {'value': u"Titre de Synthèse de colonne en français pour colonne négative", 'localeCode': u"fr"},
                        {'value': u"Title of Column Synthesis in english for negative column", 'localeCode': u"en"}
                    ],
                    'columnSynthesisBody': [
                        {'value': u"Synthèse de colonne en français for negative column", 'localeCode': u"fr"},
                        {'value': u"Column Synthesis in english for negative column", 'localeCode': u"en"}
                    ]},
                ],
                'announcement': {
                    'titleEntries': [
                        {'value': u"Title FR announce", 'localeCode': u"fr"},
                        {'value': u"Title EN announce", 'localeCode': u"en"}
                    ],
                    'bodyEntries': [
                        {'value': u"Body FR announce", 'localeCode': u"fr"},
                        {'value': u"Body EN announce", 'localeCode': u"en"}
                    ]
                }
            }]
        })
    assert res.errors is None
    created_idea_global_id = res.data['updateIdeas']['query']['thematics'][0]['id']
    created_idea = test_session.query(models.Idea).get(int(from_global_id(created_idea_global_id)[1]))
    assert len(created_idea.message_columns) == 2
    first_column = created_idea.message_columns[0]
    second_column = created_idea.message_columns[1]
    assert first_column.message_classifier == 'positive'
    assert second_column.message_classifier == 'negative'
    assert first_column.color == 'orange'
    assert second_column.color == 'green'
    assert first_column.get_positional_index() == 0
    assert second_column.get_positional_index() == 1
    assert first_column.name.entries[0].value == u"Premier entrée pour le nom modifié"
    assert first_column.title.entries[0].value == u"Premier titre pour le multicolonne modifié"
    assert second_column.name.entries[0].value == u"Deuxième entrée pour le nom"
    assert second_column.title.entries[0].value == u"Deuxième titre pour le multicolonne"
    first_synthesis = first_column.get_column_synthesis()
    second_synthesis = second_column.get_column_synthesis()
    assert {e.locale_code: e.value for e in first_synthesis.subject.entries} == {
        u'fr': u'Titre de Synthèse de colonne en français pour colonne positive modifié',
        u'en': u'Title of Column Synthesis in english for positive column modified'}
    assert {e.locale_code: e.value for e in first_synthesis.body.entries} == {
        u'fr': u'Synthèse de colonne en français for positive column modifié',
        u'en': u'Column Synthesis in english for positive column modified'}
    assert {e.locale_code: e.value for e in second_synthesis.subject.entries} == {
        u'fr': u'Titre de Synthèse de colonne en français pour colonne négative',
        u'en': u'Title of Column Synthesis in english for negative column'}
    assert {e.locale_code: e.value for e in second_synthesis.body.entries} == {
        u'fr': u'Synthèse de colonne en français for negative column',
        u'en': u'Column Synthesis in english for negative column'}
    test_session.rollback()


def test_mutation_update_ideas_multicol_delete_neutral_column(test_session, graphql_request, graphql_registry, phases):
    test_session.commit()
    # idea with 3 columns
    res = schema.execute(
        graphql_registry['updateIdeas'],
        context_value=graphql_request,
        variable_values={
            'discussionPhaseId': phases['multiColumns'].id,
            'ideas': [{
                'messageViewOverride': 'messageColumns',
                'titleEntries': [
                    {'value': u"Comprendre les dynamiques et les enjeux", 'localeCode': u"fr"},
                    {'value': u"Understanding the dynamics and issues", 'localeCode': u"en"}
                ],
                'descriptionEntries': [
                    {'value': u"Desc FR", 'localeCode': u"fr"},
                    {'value': u"Desc EN", 'localeCode': u"en"}
                ],
                'messageColumns': [
                    {'nameEntries': [{'value': u"Premier entrée pour le nom", "localeCode": u"fr"}],
                    'titleEntries': [{'value': u"Premier titre pour le multicolonne", "localeCode": u"fr"}],
                    'color': 'red',
                    'messageClassifier': 'positive',
                    'columnSynthesisSubject': [
                        {'value': u"Titre de Synthèse de colonne en français pour colonne positive", 'localeCode': u"fr"},
                        {'value': u"Title of Column Synthesis in english for positive column", 'localeCode': u"en"}
                    ],
                    'columnSynthesisBody': [
                        {'value': u"Synthèse de colonne en français for positive column", 'localeCode': u"fr"},
                        {'value': u"Column Synthesis in english for positive column", 'localeCode': u"en"}
                    ]},
                    {'nameEntries': [{'value': u"Deuxième entrée pour le nom", "localeCode": u"fr"}],
                    'titleEntries': [{'value': u"Deuxième titre pour le multicolonne", "localeCode": u"fr"}],
                    'color': 'green',
                    'messageClassifier': 'negative',
                    'columnSynthesisSubject': [
                        {'value': u"Titre de Synthèse de colonne en français pour colonne négative", 'localeCode': u"fr"},
                        {'value': u"Title of Column Synthesis in english for negative column", 'localeCode': u"en"}
                    ],
                    'columnSynthesisBody': [
                        {'value': u"Synthèse de colonne en français for negative column", 'localeCode': u"fr"},
                        {'value': u"Column Synthesis in english for negative column", 'localeCode': u"en"}
                    ]},
                    {'nameEntries': [{'value': u"troisième entrée pour le nom", "localeCode": u"fr"}],
                    'titleEntries': [{'value': u"troisième titre pour le multicolonne", "localeCode": u"fr"}],
                    'color': 'blue',
                    'messageClassifier': 'neutral',
                    'columnSynthesisSubject': [
                        {'value': u"Titre de Synthèse de colonne en français pour colonne neutre", 'localeCode': u"fr"},
                        {'value': u"Title of Column Synthesis in english for neutral column", 'localeCode': u"en"}
                    ],
                    'columnSynthesisBody': [
                        {'value': u"Synthèse de colonne en français for neutral column", 'localeCode': u"fr"},
                        {'value': u"Column Synthesis in english for neutral column", 'localeCode': u"en"}
                    ]}
                ],
                'announcement': {
                    'titleEntries': [
                        {'value': u"Title FR announce", 'localeCode': u"fr"},
                        {'value': u"Title EN announce", 'localeCode': u"en"}
                    ],
                    'bodyEntries': [
                        {'value': u"Body FR announce", 'localeCode': u"fr"},
                        {'value': u"Body EN announce", 'localeCode': u"en"}
                    ]
                }
            }]
        })
    assert res.errors is None
    created_idea_global_id = res.data['updateIdeas']['query']['thematics'][0]['id']
    created_idea = test_session.query(models.Idea).get(int(from_global_id(created_idea_global_id)[1]))
    # remove third column
    res = schema.execute(
        graphql_registry['updateIdeas'],
        context_value=graphql_request,
        variable_values={
            'discussionPhaseId': phases['multiColumns'].id,
            'ideas': [{
                'id': created_idea_global_id,
                'messageViewOverride': 'messageColumns',
                'titleEntries': [
                    {'value': u"Comprendre les dynamiques et les enjeux", 'localeCode': u"fr"},
                    {'value': u"Understanding the dynamics and issues", 'localeCode': u"en"}
                ],
                'descriptionEntries': [
                    {'value': u"Desc FR", 'localeCode': u"fr"},
                    {'value': u"Desc EN", 'localeCode': u"en"}
                ],
                'messageColumns': [
                    {'nameEntries': [{'value': u"Premier entrée pour le nom", "localeCode": u"fr"}],
                    'titleEntries': [{'value': u"Premier titre pour le multicolonne", "localeCode": u"fr"}],
                    'color': 'red',
                    'messageClassifier': 'positive',
                    'columnSynthesisSubject': [
                        {'value': u"Titre de Synthèse de colonne en français pour colonne positive", 'localeCode': u"fr"},
                        {'value': u"Title of Column Synthesis in english for positive column", 'localeCode': u"en"}
                    ],
                    'columnSynthesisBody': [
                        {'value': u"Synthèse de colonne en français for positive column", 'localeCode': u"fr"},
                        {'value': u"Column Synthesis in english for positive column", 'localeCode': u"en"}
                    ]},
                    {'nameEntries': [{'value': u"Deuxième entrée pour le nom", "localeCode": u"fr"}],
                    'titleEntries': [{'value': u"Deuxième titre pour le multicolonne", "localeCode": u"fr"}],
                    'color': 'green',
                    'messageClassifier': 'negative',
                    'columnSynthesisSubject': [
                        {'value': u"Titre de Synthèse de colonne en français pour colonne négative", 'localeCode': u"fr"},
                        {'value': u"Title of Column Synthesis in english for negative column", 'localeCode': u"en"}
                    ],
                    'columnSynthesisBody': [
                        {'value': u"Synthèse de colonne en français for negative column", 'localeCode': u"fr"},
                        {'value': u"Column Synthesis in english for negative column", 'localeCode': u"en"}
                    ]}
                ],
                'announcement': {
                    'titleEntries': [
                        {'value': u"Title FR announce", 'localeCode': u"fr"},
                        {'value': u"Title EN announce", 'localeCode': u"en"}
                    ],
                    'bodyEntries': [
                        {'value': u"Body FR announce", 'localeCode': u"fr"},
                        {'value': u"Body EN announce", 'localeCode': u"en"}
                    ]
                }
            }]
        })
    assert res.errors is None
    created_idea_global_id = res.data['updateIdeas']['query']['thematics'][0]['id']
    created_idea = test_session.query(models.Idea).get(int(from_global_id(created_idea_global_id)[1]))
    assert len(created_idea.message_columns) == 2
    first_column = created_idea.message_columns[0]
    second_column = created_idea.message_columns[1]
    assert first_column.message_classifier == 'positive'
    assert second_column.message_classifier == 'negative'
    test_session.rollback()


def test_mutation_update_ideas_create(test_session, graphql_request, graphql_registry, phases):
    test_session.commit()
    import os
    from io import BytesIO

    class FieldStorage(object):
        file = BytesIO(os.urandom(16))
        filename = u'path/to/img.png'
        type = 'image/png'

    graphql_request.POST['variables.ideas.0.image'] = FieldStorage()

    res = schema.execute(
        graphql_registry['updateIdeas'],
        context_value=graphql_request,
        variable_values={
            'discussionPhaseId': phases['brightMirror'].id,
            'ideas': [{
                'messageViewOverride': 'brightMirror',
                'titleEntries': [
                    {'value': u"Comprendre les dynamiques et les enjeux", 'localeCode': u"fr"},
                    {'value': u"Understanding the dynamics and issues", 'localeCode': u"en"}
                ],
                'descriptionEntries': [
                    {'value': u"Desc FR", 'localeCode': u"fr"},
                    {'value': u"Desc EN", 'localeCode': u"en"}
                ],
                'image': u'variables.ideas.0.image',  # this is added via graphql_wsgi but we need to do it ourself here
                'announcement': {
                    'titleEntries': [
                        {'value': u"Title FR announce", 'localeCode': u"fr"},
                        {'value': u"Title EN announce", 'localeCode': u"en"}
                    ],
                    'bodyEntries': [
                        {'value': u"Body FR announce", 'localeCode': u"fr"},
                        {'value': u"Body EN announce", 'localeCode': u"en"}
                    ],
                    'summaryEntries': [
                        {'value': u"Summary FR announce", 'localeCode': u"fr"},
                        {'value': u"Summary EN announce", 'localeCode': u"en"}
                    ]
                }
            }]
        })
    assert res.errors is None
    ideas = res.data['updateIdeas']['query']['thematics']
    assert len(ideas) == 1
    idea = ideas[0]
    assert idea['announcement'] == {
        u'bodyEntries': [{u'localeCode': u'en', u'value': u'Body EN announce'},
                         {u'localeCode': u'fr', u'value': u'Body FR announce'}],
        u'titleEntries': [{u'localeCode': u'en', u'value': u'Title EN announce'},
                          {u'localeCode': u'fr', u'value': u'Title FR announce'}],
        u'quoteEntries': [],
        u'summaryEntries': [{u'localeCode': u'en', u'value': u'Summary EN announce'},
                            {u'localeCode': u'fr', u'value': u'Summary FR announce'}]
        }
    assert idea['titleEntries'] == [
        {u'localeCode': u'en', u'value': u'Understanding the dynamics and issues'},
        {u'localeCode': u'fr', u'value': u'Comprendre les dynamiques et les enjeux'}]
    assert idea['descriptionEntries'] == [
        {u'localeCode': u'en', u'value': u'Desc EN'},
        {u'localeCode': u'fr', u'value': u'Desc FR'}]
    assert idea['img'] is not None
    assert 'externalUrl' in idea['img']
    assert idea['messageViewOverride'] == u'brightMirror'
    assert idea['order'] == 1.0

    # and update the idea without changing the image
    del graphql_request.POST['variables.ideas.0.image']
    res = schema.execute(
        graphql_registry['updateIdeas'],
        context_value=graphql_request,
        variable_values={
            'discussionPhaseId': phases['brightMirror'].id,
            'ideas': [{
                'id': idea['id'],  # specify id will do update_idea instead of create_idea
                'messageViewOverride': 'brightMirror',
                'titleEntries': [
                    {'value': u"[modified] Comprendre les dynamiques et les enjeux", 'localeCode': u"fr"},
                    {'value': u"[modified] Understanding the dynamics and issues", 'localeCode': u"en"}
                ],
                'descriptionEntries': [
                    {'value': u"[modified] Desc FR", 'localeCode': u"fr"},
                    {'value': u"[modified] Desc EN", 'localeCode': u"en"}
                ],
                'announcement': {
                    'titleEntries': [
                        {'value': u"[modified] Title FR announce", 'localeCode': u"fr"},
                        {'value': u"[modified] Title EN announce", 'localeCode': u"en"}
                    ],
                    'bodyEntries': [
                        {'value': u"[modified] Body FR announce", 'localeCode': u"fr"},
                        {'value': u"[modified] Body EN announce", 'localeCode': u"en"}
                    ],
                    'summaryEntries': [
                        {'value': u"[modified] Summary FR announce", 'localeCode': u"fr"},
                        {'value': u"[modified] Summary EN announce", 'localeCode': u"en"}
                    ]
                }
            }]
        })

    assert res.errors is None
    ideas = res.data['updateIdeas']['query']['thematics']
    assert len(ideas) == 1
    idea = ideas[0]
    assert idea['announcement'] == {
        u'bodyEntries': [{u'localeCode': u'en', u'value': u'[modified] Body EN announce'},
                         {u'localeCode': u'fr', u'value': u'[modified] Body FR announce'}],
        u'titleEntries': [{u'localeCode': u'en', u'value': u'[modified] Title EN announce'},
                          {u'localeCode': u'fr', u'value': u'[modified] Title FR announce'}],
        u'quoteEntries': [],
        u'summaryEntries': [{u'localeCode': u'en', u'value': u'[modified] Summary EN announce'},
                        {u'localeCode': u'fr', u'value': u'[modified] Summary FR announce'}],}
    assert idea['titleEntries'] == [
        {u'localeCode': u'en', u'value': u'[modified] Understanding the dynamics and issues'},
        {u'localeCode': u'fr', u'value': u'[modified] Comprendre les dynamiques et les enjeux'}]
    assert idea['descriptionEntries'] == [
        {u'localeCode': u'en', u'value': u'[modified] Desc EN'},
        {u'localeCode': u'fr', u'value': u'[modified] Desc FR'}]
    assert idea['img'] is not None
    assert 'externalUrl' in idea['img']
    assert idea['messageViewOverride'] == u'brightMirror'
    assert idea['order'] == 1.0

    # cleanup
    test_session.rollback()


def test_mutation_update_ideas_delete(test_session, graphql_request, graphql_registry, phases):
    test_session.commit()
    import os
    from io import BytesIO

    class FieldStorage(object):
        file = BytesIO(os.urandom(16))
        filename = u'path/to/img.png'
        type = 'image/png'

    graphql_request.POST['variables.ideas.0.image'] = FieldStorage()

    res = schema.execute(
        graphql_registry['updateIdeas'],
        context_value=graphql_request,
        variable_values={
            'discussionPhaseId': phases['brightMirror'].id,
            'ideas': [
                {
                    'messageViewOverride': 'brightMirror',
                    'titleEntries': [
                        {'value': u"Comprendre les dynamiques et les enjeux", 'localeCode': u"fr"},
                        {'value': u"Understanding the dynamics and issues", 'localeCode': u"en"}
                    ],
                    'descriptionEntries': [
                        {'value': u"Desc FR", 'localeCode': u"fr"},
                        {'value': u"Desc EN", 'localeCode': u"en"}
                    ],
                    'image': u'variables.ideas.0.image',  # this is added via graphql_wsgi but we need to do it ourself here
                    'announcement': {
                        'titleEntries': [
                            {'value': u"Title FR announce", 'localeCode': u"fr"},
                            {'value': u"Title EN announce", 'localeCode': u"en"}
                        ],
                        'bodyEntries': [
                            {'value': u"Body FR announce", 'localeCode': u"fr"},
                            {'value': u"Body EN announce", 'localeCode': u"en"}
                        ]
                    }
                },
                {
                    'messageViewOverride': None,
                    'titleEntries': [
                        {'value': u"Thread FR", 'localeCode': u"fr"},
                        {'value': u"Thread EN", 'localeCode': u"en"}
                    ],
                    'descriptionEntries': [
                        {'value': u"Desc FR", 'localeCode': u"fr"},
                        {'value': u"Desc EN", 'localeCode': u"en"}
                    ],
                    'announcement': {
                        'titleEntries': [
                            {'value': u"Title FR announce", 'localeCode': u"fr"},
                            {'value': u"Title EN announce", 'localeCode': u"en"}
                        ],
                        'bodyEntries': [
                            {'value': u"Body FR announce", 'localeCode': u"fr"},
                            {'value': u"Body EN announce", 'localeCode': u"en"}
                        ]
                    }
                }
            ]
        })

    assert res.errors is None
    ideas = res.data['updateIdeas']['query']['thematics']
    assert len(ideas) == 2
    bright = ideas[0]
    assert bright['messageViewOverride'] == u'brightMirror'
    thread = ideas[1]
    assert thread['messageViewOverride'] == u'noModule'

    # and remove it
    del graphql_request.POST['variables.ideas.0.image']
    res = schema.execute(
        graphql_registry['updateIdeas'],
        context_value=graphql_request,
        variable_values={
            'discussionPhaseId': phases['brightMirror'].id,
            'ideas': [
                {
                    'id': thread['id'],
                    'messageViewOverride': None,
                    'titleEntries': [
                        {'value': u"Thread FR", 'localeCode': u"fr"},
                        {'value': u"Thread EN", 'localeCode': u"en"}
                    ],
                    'descriptionEntries': [
                        {'value': u"Desc FR", 'localeCode': u"fr"},
                        {'value': u"Desc EN", 'localeCode': u"en"}
                    ],
                    'announcement': {
                        'titleEntries': [
                            {'value': u"Title FR announce", 'localeCode': u"fr"},
                            {'value': u"Title EN announce", 'localeCode': u"en"}
                        ],
                        'bodyEntries': [
                            {'value': u"Body FR announce", 'localeCode': u"fr"},
                            {'value': u"Body EN announce", 'localeCode': u"en"}
                        ]
                    }
                }
            ]
        })

    assert res.errors is None
    ideas = res.data['updateIdeas']['query']['thematics']
    assert len(ideas) == 1

    # cleanup
    test_session.rollback()


def test_mutation_update_ideas_child_survey(test_session, graphql_request, graphql_registry, phases):
    test_session.commit()
    import os
    from io import BytesIO

    class FieldStorage(object):
        file = BytesIO(os.urandom(16))
        filename = u'path/to/img.png'
        type = 'image/png'

    graphql_request.POST['variables.ideas.0.image'] = FieldStorage()
    graphql_request.POST['variables.ideas.0.children.0.image'] = FieldStorage()

    res = schema.execute(
        graphql_registry['updateIdeas'],
        context_value=graphql_request,
        variable_values={
            'discussionPhaseId': phases['brightMirror'].id,
            'ideas': [{
                'messageViewOverride': 'brightMirror',
                'titleEntries': [
                    {'value': u"Comprendre les dynamiques et les enjeux", 'localeCode': u"fr"},
                    {'value': u"Understanding the dynamics and issues", 'localeCode': u"en"}
                ],
                'descriptionEntries': [
                    {'value': u"Desc FR", 'localeCode': u"fr"},
                    {'value': u"Desc EN", 'localeCode': u"en"}
                ],
                'image': u'variables.ideas.0.image',  # this is added via graphql_wsgi but we need to do it ourself here
                'announcement': {
                    'titleEntries': [
                        {'value': u"Title FR announce", 'localeCode': u"fr"},
                        {'value': u"Title EN announce", 'localeCode': u"en"}
                    ],
                    'bodyEntries': [
                        {'value': u"Body FR announce", 'localeCode': u"fr"},
                        {'value': u"Body EN announce", 'localeCode': u"en"}
                    ],
                },
                'children': [{
                    'messageViewOverride': 'survey',
                    'titleEntries': [
                        {'value': u"[survey] Comprendre les dynamiques et les enjeux", 'localeCode': u"fr"},
                        {'value': u"[survey] Understanding the dynamics and issues", 'localeCode': u"en"}
                    ],
                    'descriptionEntries': [
                        {'value': u"[survey] Desc FR", 'localeCode': u"fr"},
                        {'value': u"[survey] Desc EN", 'localeCode': u"en"}
                    ],
                    'image': u'variables.ideas.0.children.0.image',  # this is added via graphql_wsgi but we need to do it ourself here
                    'questions': [
                        {'titleEntries': [
                            {'value': u"Comment qualifiez-vous l'emergence de l'Intelligence Artificielle dans notre société ?", 'localeCode': "fr"}
                        ]},
                        {'titleEntries': [
                            {'value': u"Seconde question ?", 'localeCode': "fr"}
                        ]},
                        {'titleEntries': [
                            {'value': u"Troisième question ?", 'localeCode': "fr"}
                        ]},
                    ],
                }]
            }]
        })

    assert res.errors is None
    ideas = res.data['updateIdeas']['query']['thematics']
    assert len(ideas) == 2
    bright = ideas[0]
    assert bright['messageViewOverride'] == u'brightMirror'

    survey = ideas[1]
    assert bright['id'] == survey['parentId']
    assert survey['titleEntries'] == [
        {u'value': u"[survey] Understanding the dynamics and issues",
         u'localeCode': u"en"},
        {u'value': u"[survey] Comprendre les dynamiques et les enjeux",
         u'localeCode': u"fr"}
    ]
    assert survey['questions'][0]['titleEntries'] == [
        {u'value': u"Comment qualifiez-vous l'emergence de l'Intelligence Artificielle dans notre société ?", u'localeCode': u"fr"}
    ]
    assert survey['questions'][1]['titleEntries'] == [
        {u'value': u"Seconde question ?", u'localeCode': u"fr"}
    ]
    assert survey['questions'][2]['titleEntries'] == [
        {u'value': u"Troisième question ?", u'localeCode': u"fr"}
    ]

    # cleanup
    test_session.rollback()
