# -*- coding: utf-8 -*-
import json
import pytest

from graphql_relay.node.node import to_global_id

from assembl import models
from assembl.graphql.schema import Schema as schema


def get_tags(db):
    return db.query(models.AbstractTag).all()

def test_add_tag_on_post_new(graphql_request, discussion, abstract_tags, top_post_in_thread_phase):
    variable_values = {
        "postId" : top_post_in_thread_phase,
        "value": "new tag"
    }

    res = schema.execute(u"""
        mutation addTagOnPost(
        $postId: ID!
        $value: String!
        ) {
        addTagOnPost(
            postId: $postId
            value: $value
        ) {
            tags {
            value
            }
        }
        }
    """, context_value=graphql_request, variable_values=variable_values)

    assert json.loads(json.dumps(res.data)) == {
        u'addTagOnPost': {
        u'tags': [{u'value': u'new tag'}]
        }
    }
    assert len(get_tags(discussion.db)) == 3


def test_add_tag_on_post_existing(graphql_request, discussion, abstract_tags, top_post_in_thread_phase):
    variable_values = {
        "postId" : top_post_in_thread_phase,
        "value": "tag1"
    }

    res = schema.execute(u"""
        mutation addTagOnPost(
        $postId: ID!
        $value: String!
        ) {
        addTagOnPost(
            postId: $postId
            value: $value
        ) {
            tags {
            value
            }
        }
        }
    """, context_value=graphql_request, variable_values=variable_values)

    assert json.loads(json.dumps(res.data)) == {
        u'addTagOnPost': {
        u'tags': [{u'value': u'tag1'}]
        }
    }
    assert len(get_tags(discussion.db)) == 2


def test_add_tag_on_post_already_added(graphql_request, test_session, abstract_tags, top_post_in_thread_phase):
    from graphene.relay import Node
    raw_id = int(Node.from_global_id(top_post_in_thread_phase)[1])
    from assembl.models import Post
    post = Post.get(raw_id)
    association1 = models.TagOnPost()
    association1.abstract_tag = abstract_tags[0]
    association1.post = post
    association2 = models.TagOnPost()
    association2.abstract_tag = abstract_tags[1]
    association2.post = post
    test_session.add(association1)
    test_session.add(association2)
    test_session.flush()

    variable_values = {
        "postId" : top_post_in_thread_phase,
        "value": "tag1"
    }

    res = schema.execute(u"""
        mutation addTagOnPost(
        $postId: ID!
        $value: String!
        ) {
        addTagOnPost(
            postId: $postId
            value: $value
        ) {
            tags {
            value
            }
        }
        }
    """, context_value=graphql_request, variable_values=variable_values)

    assert json.loads(json.dumps(res.data)) == {
        u'addTagOnPost': {
        u'tags': [{u'value': u'tag1'}, {u'value': u'tag2'}]
        }
    }
    assert len(get_tags(post.db)) == 2


def test_delete_tag_on_post(graphql_request, test_session, abstract_tags, top_post_in_thread_phase, root_post_1):
    from graphene.relay import Node
    raw_id = int(Node.from_global_id(top_post_in_thread_phase)[1])
    from assembl.models import Post
    post = Post.get(raw_id)
    association1 = models.TagOnPost()
    association1.abstract_tag = abstract_tags[0]
    association1.post = post
    association2 = models.TagOnPost()
    association2.abstract_tag = abstract_tags[1]
    association2.post = post
    test_session.add(association1)
    test_session.add(association2)
    test_session.flush()

    association3 = models.TagOnPost()
    association3.abstract_tag = abstract_tags[0]
    association3.post = root_post_1
    association4 = models.TagOnPost()
    association4.abstract_tag = abstract_tags[1]
    association4.post = root_post_1
    test_session.add(association3)
    test_session.add(association4)
    test_session.flush()

    variable_values = {
        "postId" : top_post_in_thread_phase,
        "value": "tag1"
    }

    res = schema.execute(u"""
        mutation deleteTagOnPost(
        $postId: ID!
        $value: String!
        ) {
        deleteTagOnPost(
            postId: $postId
            value: $value
        ) {
            tags{
                value
            }
        }
        }
    """, context_value=graphql_request, variable_values=variable_values)

    assert json.loads(json.dumps(res.data)) == {
        u'deleteTagOnPost': {
        u'tags': [{u'value': u'tag2'}]
        }
    }
    assert len(get_tags(post.db)) == 2

def test_delete_tag_on_post_and_delete_unused_abstract_tag(graphql_request, test_session, abstract_tags, top_post_in_thread_phase):
    from graphene.relay import Node
    raw_id = int(Node.from_global_id(top_post_in_thread_phase)[1])
    from assembl.models import Post
    post = Post.get(raw_id)
    association1 = models.TagOnPost()
    association1.abstract_tag = abstract_tags[0]
    association1.post = post
    association2 = models.TagOnPost()
    association2.abstract_tag = abstract_tags[1]
    association2.post = post
    test_session.add(association1)
    test_session.add(association2)
    test_session.flush()

    variable_values = {
        "postId" : top_post_in_thread_phase,
        "value": "tag1"
    }

    res = schema.execute(u"""
        mutation deleteTagOnPost(
        $postId: ID!
        $value: String!
        ) {
        deleteTagOnPost(
            postId: $postId
            value: $value
        ) {
            tags{
                value
            }
        }
        }
    """, context_value=graphql_request, variable_values=variable_values)

    assert json.loads(json.dumps(res.data)) == {
        u'deleteTagOnPost': {
        u'tags': [{u'value': u'tag2'}]
        }
    }
    assert len(get_tags(post.db)) == 1


def test_query_abstract_tags(graphql_request, abstract_tags):
    res = schema.execute(u"""
        query abstractTags {
            abstractTags{
                value
            }
        }
    """, context_value=graphql_request)

    assert res.data['abstractTags'] == [{'value': 'tag1'}, {'value': 'tag2'}]


def test_get_tags_on_post(admin_user, graphql_request, test_session, discussion, top_post_in_thread_phase, abstract_tags):
    from graphene.relay import Node
    raw_id = int(Node.from_global_id(top_post_in_thread_phase)[1])
    from assembl.models import TagOnPost, Post
    post = Post.get(raw_id)
    association1 = TagOnPost()
    association1.abstract_tag = abstract_tags[0]
    association1.post = post
    association2 = TagOnPost()
    association2.abstract_tag = abstract_tags[1]
    association2.post = post
    test_session.add(association1)
    test_session.add(association2)
    test_session.flush()

    res = schema.execute(u"""
query Post($id: ID!) {
  post: node(id: $id) {
    ... on Post {
      tags {
        value
      }
    }
  }
}
""", context_value=graphql_request, variable_values={
        "id": top_post_in_thread_phase,
    })
    assert json.loads(json.dumps(res.data)) == {
        u'post': {
            u'tags': [
                {u'value': u'tag1'},
                {u'value': u'tag2'},
                ]
            }}