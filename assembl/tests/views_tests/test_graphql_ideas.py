# -*- coding: utf-8 -*-
import json

from graphql_relay.node.node import to_global_id

from assembl import models
from assembl.graphql.schema import Schema as schema


def test_graphql_get_all_ideas(graphql_request,
                               user_language_preference_en_cookie,
                               subidea_1_1_1):
    res = schema.execute(
        u"""query AllIdeasQuery($lang: String!, $identifier: String!) {
            ideas(identifier: $identifier) {
              ... on Idea {
                id
                title(lang: $lang)
                titleEntries { value, localeCode }
                numPosts
                numContributors
                numChildren(identifier: $identifier)
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
        variable_values={"identifier": u"thread", "lang": u"en"})
    assert res.data['rootIdea']['id'] is not None
    assert len(res.data['ideas']) == 4
    first_idea = res.data['ideas'][0]
    second_idea = res.data['ideas'][1]
    third_idea = res.data['ideas'][2]
    root_idea = res.data['ideas'][3]
    assert root_idea['parentId'] is None
    assert root_idea['id'] == res.data['rootIdea']['id']
    assert root_idea['order'] is None
    assert root_idea['numChildren'] == 1
    assert first_idea['title'] == u'Favor economic growth'
    assert first_idea['parentId'] == root_idea['id']
    assert first_idea['order'] == 0.0
    assert first_idea['numChildren'] == 1
    assert second_idea['title'] == u'Lower taxes'
    assert second_idea['parentId'] == first_idea['id']
    assert second_idea['order'] == 0.0
    assert second_idea['numChildren'] == 1
    assert third_idea['title'] == u'Lower government revenue'
    assert third_idea['parentId'] == second_idea['id']
    assert third_idea['order'] == 0.0
    assert third_idea['numChildren'] == 0
    assert len(res.errors) == 0


def test_graphql_get_all_ideas_multiColumns_phase(graphql_request,
                               user_language_preference_en_cookie,
                               subidea_1_1_1,
                               idea_message_column_positive,
                               idea_message_column_negative):
    # idea_message_column_positive/negative fixtures add columns on subidea_1
    # the ideas query should return only subidea_1 (root idea is filtered out too)
    res = schema.execute(
        u"""query AllIdeasQuery($lang: String!, $identifier: String!) {
            ideas(identifier: $identifier) {
              ... on Idea {
                id
                title(lang: $lang)
                titleEntries { value, localeCode }
                numPosts
                numContributors
                numChildren(identifier: $identifier)
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
        variable_values={"identifier": u"multiColumns", "lang": u"en"})
    assert res.data['rootIdea']['id'] is not None
    assert len(res.data['ideas']) == 1
    first_idea = res.data['ideas'][0]
    assert first_idea['title'] == u'Favor economic growth'
    assert first_idea['parentId'] == res.data['rootIdea']['id']
    assert first_idea['order'] == 0.0
    assert first_idea['numChildren'] == 0
    assert len(res.errors) == 0


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
                  numPosts
                }
              }
              numParticipants
            }
        """, context_value=graphql_request, variable_values={'identifier': 'survey'})
    assert res.data['rootIdea']['numPosts'] == 15
    assert res.data['numParticipants'] == 1


def test_graphql_discussion_counters_thread_phase(graphql_request, proposals):
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
        """, context_value=graphql_request, variable_values={'identifier': 'thread'})
    assert res.data['rootIdea']['numPosts'] == 15  # we count all posts from phase 1
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
                creator=admin_user, owner=admin_user, discussion=discussion))
    post.extracts.append(
        Extract(body=u"super important quote", important=True,
                creator=admin_user, owner=admin_user, discussion=discussion))
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
