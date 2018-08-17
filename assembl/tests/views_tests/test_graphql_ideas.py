# -*- coding: utf-8 -*-
import json
import pytest

from graphql_relay.node.node import to_global_id, from_global_id

from assembl import models
from assembl.graphql.schema import Schema as schema


def test_graphql_numPosts_of_sub_idea_1(phases, graphql_request, root_idea, subidea_1, subidea_1_1,
                                             subidea_1_1_1,
                                             idea_message_column_positive_on_subidea_1_1,
                                             idea_message_column_negative_on_subidea_1_1,
                                             root_post_en_under_negative_column_of_subidea_1_1,
                                             root_post_en_under_positive_column_of_subidea_1_1,
                                             post_related_to_sub_idea_1_1_1,
                                             post_related_to_sub_idea_1
                                             ):
    subidea_1_1.message_view_override = 'messageColumns'
    subidea_1_1.messages_in_parent = False
    subidea_1_1.db.flush()
    # This test verify that we don't care about messages_in_parent to count posts.
    res = schema.execute(
        u"""query AllIdeasQuery ($discussionPhaseId: Int!){
            ideas (discussionPhaseId: $discussionPhaseId) {
              ... on Idea {
                id
                numPosts
              }
            }
            rootIdea {
              ... on Idea {
                id
                numPosts
              }
            }
        }
        """, context_value=graphql_request, variable_values={"discussionPhaseId": phases['thread'].id})
    assert res.errors is None
    root_idea = res.data['rootIdea']

    def findIdeaById(id):
        for idea in res.data['ideas']:
            if int(from_global_id(idea['id'])[1]) == id:
                return idea

    idea = findIdeaById(subidea_1.id)
    child_idea = findIdeaById(subidea_1_1.id)
    grand_child_idea = findIdeaById(subidea_1_1_1.id)
    assert root_idea['numPosts'] == 4
    assert idea['numPosts'] == 4
    assert child_idea['numPosts'] == 3
    assert grand_child_idea['numPosts'] == 1


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
            rootIdea {
              ... on Idea {
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


def test_graphql_get_all_ideas_multiColumns_phase(phases, graphql_request,
                                                  user_language_preference_en_cookie,
                                                  subidea_1,
                                                  subidea_1_1_1,
                                                  idea_message_column_positive,
                                                  idea_message_column_negative,
                                                  idea_message_column_positive_on_subidea_1_1):
    subidea_1.message_view_override = 'messageColumns'
    subidea_1.db.flush()
    # idea_message_column_positive/negative fixtures add columns on subidea_1
    # the ideas query should return only subidea_1
    # We have a column on subidea_1_1, but messageColumns is not enabled on it.
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
            rootIdea {
              ... on Idea {
                id
              }
            }
        }
        """, context_value=graphql_request,
        variable_values={"discussionPhaseId": phases['multiColumns'].id, "lang": u"en"})
    root_idea = res.data['rootIdea']
    assert root_idea['id'] is not None
    assert len(res.data['ideas']) == 1
    first_idea = res.data['ideas'][0]
    assert first_idea['title'] == u'Favor economic growth'
    assert first_idea['parentId'] == root_idea['id']
    assert first_idea['order'] == 0.0
    assert first_idea['numChildren'] == 0
    assert first_idea['messageViewOverride'] == 'messageColumns'
    assert res.errors is None
    # revert the changes for tests isolation
    subidea_1.message_view_override = None
    subidea_1.db.flush()


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
            rootIdea {
              ... on Idea {
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
            rootIdea {
              ... on Idea {
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


def test_graphql_discussion_counters_survey_phase_no_thematic(graphql_request):
    res = schema.execute(
        u"""query RootIdeaStats($identifier: String) {
              rootIdea(identifier: $identifier) {
                ... on Node {
                  id
                }
                ... on IdeaInterface {
                  numPosts
                }
              }
              numParticipants
            }
        """, context_value=graphql_request, variable_values={'identifier': 'survey'})
    assert res.data['rootIdea'] is None
    assert res.data['numParticipants'] == 1


def test_graphql_discussion_counters_survey_phase_with_proposals(graphql_request, proposals):
    res = schema.execute(
        u"""query RootIdeaStats($identifier: String) {
              rootIdea(identifier: $identifier) {
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
        """, context_value=graphql_request, variable_values={'identifier': 'survey'})
    assert res.data['rootIdea']['numTotalPosts'] == 15  # all posts
    assert res.data['rootIdea']['numPosts'] == 15  # phase 1 posts
    assert res.data['numParticipants'] == 1


def test_graphql_discussion_counters_thread_phase(graphql_request, proposals):
    res = schema.execute(
        u"""query RootIdeaStats($identifier: String) {
              rootIdea(identifier: $identifier) {
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
        """, context_value=graphql_request, variable_values={'identifier': 'thread'})
    assert res.data['rootIdea']['numTotalPosts'] == 15  # all posts
    assert res.data['rootIdea']['numPosts'] == 15  # phase 1+2 posts counted when current phase is thread
    assert res.data['numParticipants'] == 1


def test_graphql_discussion_counters_thread_phase_deleted_thematic(graphql_request, thematic_and_question, proposals):
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
        u"""query RootIdeaStats($identifier: String) {
              rootIdea(identifier: $identifier) {
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
        """, context_value=graphql_request, variable_values={'identifier': 'thread'})
    assert res.data['rootIdea']['numTotalPosts'] == 15  # all posts
    # But the posts are not bound anymore
    assert res.data['rootIdea']['numPosts'] == 0
    assert res.data['numParticipants'] == 1


def test_graphql_discussion_counters_thread_phase_with_posts(graphql_request, proposals, top_post_in_thread_phase):
    res = schema.execute(
        u"""query RootIdeaStats($identifier: String) {
              rootIdea(identifier: $identifier) {
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
        """, context_value=graphql_request, variable_values={'identifier': 'thread'})
    assert res.data['rootIdea']['numTotalPosts'] == 16  # all posts
    assert res.data['rootIdea']['numPosts'] == 16  # phase 1+2 posts counted when current phase is thread
    assert res.data['numParticipants'] == 1


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


def test_announcement_on_idea(graphql_request, announcement_en_fr):
    from graphene.relay import Node
    idea_id = announcement_en_fr.idea.id
    node_id = Node.to_global_id('Idea', idea_id)
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
            u'announcement': {
                u'title': u"Announce title in English",
                u'body': u"Announce body in English"
            }
        }
    }


def test_no_announcement_on_ideas(graphql_request, idea_with_en_fr):
    from graphene.relay import Node
    idea_id = idea_with_en_fr.id
    node_id = Node.to_global_id('Idea', idea_id)
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
      thematic {
        id
        title(lang: $lang)
        img {
          externalUrl
          mimeType
        }
      }
    }
  }
}
""", context_value=graphql_request, variable_values={
        "id": node_id,
        "lang": "en"
    })

    assert json.loads(json.dumps(res.data)) == {
      u'question': {
          u'thematic': {
              u'id': thematic_and_question[0],
              u'img': None,
              u'title': u'Understanding the dynamics and issues'
          },
          u'id': node_id,
          u'title': u"Comment qualifiez-vous l'emergence de l'Intelligence Artificielle dans notre société ?"
      }
    }


def test_graphql_get_question_posts(graphql_request, thematic_and_question, proposals):
    node_id = thematic_and_question[1]
    len_proposals = len(proposals)
    res = schema.execute(u"""
query QuestionPosts($id: ID!, $first: Int!, $after: String!) {
  question: node(id: $id) {
    ... on Question {
      id
      posts(first: $first, after: $after) {
        pageInfo {
          endCursor
          hasNextPage
        }
        edges {
          node {
            ... on Post {
              id
              originalLocale
            }
          }
        }
      }
    }
  }
}
""", context_value=graphql_request, variable_values={
        "id": node_id,
        "first": len_proposals,
        "after": ""
    })
    result = json.loads(json.dumps(res.data))
    assert 'question' in result and 'posts' in result['question'] and 'edges' in result['question']['posts']
    question_posts = result['question']['posts']['edges']
    assert len(question_posts) ==  len_proposals
    assert all(post['node']['id'] in proposals for post in question_posts)


def test_graphql_create_bright_mirror(phases, graphql_request, graphql_registry, test_session):
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
        u'body': u'Body EN announce'
    }
    assert idea['title'] == u'Understanding the dynamics and issues'
    assert idea['description'] == u'Desc EN'
    assert idea['img'] is not None
    assert 'externalUrl' in idea['img']
    assert idea['messageViewOverride'] == u'brightMirror'
    assert idea['order'] == 1.0


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
                ]
            }
        })

    assert "Announcement titleEntries needs at least one entry" in res.errors[0].args[0]


def test_graphql_get_bright_mirror(graphql_request, graphql_registry, bright_mirror, test_session):
    res = schema.execute(
        graphql_registry['ThematicsQuery'],
        context_value=graphql_request,
        variable_values={'identifier': u'brightMirror'}
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


def test_graphql_get_bright_mirror_noresult(graphql_request, graphql_registry):
    res = schema.execute(
        graphql_registry['ThematicsQuery'],
        context_value=graphql_request,
        variable_values={'identifier': u'brightMirror'}
        )

    assert res.errors is None
    assert len(res.data['thematics']) == 0
