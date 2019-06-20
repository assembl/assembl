# -*- coding: utf-8 -*-
import json
import pytest

from graphql_relay.node.node import to_global_id

from assembl import models
from assembl.graphql.schema import Schema as schema


def test_query_tags(graphql_request, extract_post_1_to_subidea_1_1):
  variable_values = {
    "filter": ''
  }

  res = schema.execute(u"""
query tags($filter: String) {
  tags(filter: $filter) {
    value
  }
}
""", context_value=graphql_request, variable_values=variable_values)

  assert json.loads(json.dumps(res.data)) == {
    u'tags': [{u'value': u'foo'}, {u'value': u'bar'}]
  }

  variable_values = {
    "filter": 'f'
  }

  res = schema.execute(u"""
query tags($filter: String) {
  tags(filter: $filter) {
    value
  }
}
""", context_value=graphql_request, variable_values=variable_values)

  assert json.loads(json.dumps(res.data)) == {
    u'tags': [{u'value': u'foo'}]
  }

  variable_values = {
    "filter": 'test'
  }

  res = schema.execute(u"""
query tags($filter: String) {
  tags(filter: $filter) {
    value
  }
}
""", context_value=graphql_request, variable_values=variable_values)

  assert json.loads(json.dumps(res.data)) == {
    u'tags': []
  }


def test_query_tags_with_limit(graphql_request, tags):
  variable_values = {
    "limit": 1
  }

  res = schema.execute(u"""
query tags($limit: Int) {
  tags(limit: $limit) {
    value
  }
}
""", context_value=graphql_request, variable_values=variable_values)

  assert json.loads(json.dumps(res.data)) == {
    u'tags': [{u'value': u'tag1'}]
  }


def test_query_tags_no_limit(graphql_request, tags):
  variable_values = {
    "limit": 0
  }

  res = schema.execute(u"""
query tags($limit: Int) {
  tags(limit: $limit) {
    value
  }
}
""", context_value=graphql_request, variable_values=variable_values)

  assert json.loads(json.dumps(res.data)) == {
    u'tags': [{u'value': u'tag1'}, {u'value': u'tag2'}]
  }


def test_mutation_update_tag(graphql_request, tags, extract_post_1_to_subidea_1_1):
  extract_tags = extract_post_1_to_subidea_1_1.tags
  tag = extract_tags[0]
  tag_graphql_db_id = to_global_id('Keyword',tag.id)
  extract_id = to_global_id('Extract',extract_post_1_to_subidea_1_1.id)
  
  variable_values = {
    "id": tag_graphql_db_id,
    "value" : 'newFoo'
  }

  res = schema.execute(u"""
mutation updateTag(
  $id: ID!
  $value: String!
) {
  updateTag(
    id: $id
    value: $value
  ) {
    tag {
      value
    }
  }
}
""", context_value=graphql_request, variable_values=variable_values)

  assert json.loads(json.dumps(res.data)) == {
    u'updateTag': {
      u'tag': {u'value': u'newFoo'}
    }
  }
  assert tag.value == 'newFoo'

  variable_values = {
    "id": tag_graphql_db_id,
    "taggableId": extract_id, 
    "value" : 'tag1'
  }

  res = schema.execute(u"""
mutation updateTag(
  $id: ID!
  $taggableId: ID!
  $value: String!
) {
  updateTag(
    id: $id
    taggableId: $taggableId
    value: $value
  ) {
    tag {
      value
    }
  }
}
""", context_value=graphql_request, variable_values=variable_values)

  assert json.loads(json.dumps(res.data)) == {
    u'updateTag': {
      u'tag': {u'value': u'tag1'}
    }
  }

  assert tags[0] in extract_post_1_to_subidea_1_1.tags
  assert tag.value == 'newFoo'


def test_add_tag_on_post_new(graphql_request, tags, root_post_for_tags):
    post_id = to_global_id('Post',root_post_for_tags.id)
    variable_values = {
        "taggableId" : post_id,
        "value": "new tag"
    }

    res = schema.execute(u"""
        mutation addTag(
        $taggableId: ID!
        $value: String!
        ) {
        addTag(
            taggableId: $taggableId
            value: $value
        ) {
            tag {
                value
            }
            post {
                tags {
                    value
                }
            }
        }
        }
    """, context_value=graphql_request, variable_values=variable_values)

    assert json.loads(json.dumps(res.data)) == {
        u'addTag': {
        u'tag': {u'value': u'new tag'},
        u'post': {u'tags': [{u'value': u'new tag'}]}
        }
    }
    assert len(root_post_for_tags.db.query(models.Keyword).all()) == 3


def test_add_tag_on_post_existing(graphql_request, tags, root_post_for_tags):
    post_id = to_global_id('Post',root_post_for_tags.id)
    variable_values = {
        "taggableId" : post_id,
        "value": "tag1"
    }

    res = schema.execute(u"""
        mutation addTag(
        $taggableId: ID!
        $value: String!
        ) {
        addTag(
            taggableId: $taggableId
            value: $value
        ) {
            tag {
                value
            }
            post {
                tags {
                    value
                }
            }
        }
        }
    """, context_value=graphql_request, variable_values=variable_values)

    assert json.loads(json.dumps(res.data)) == {
        u'addTag': {
        u'tag': {u'value': u'tag1'},
        u'post': {u'tags': [{u'value': u'tag1'}]}
        }
    }
    assert len(root_post_for_tags.db.query(models.Keyword).all()) == 2


def test_add_tag_on_post_already_added(graphql_request, tags, root_post_with_tags):
    post_id = to_global_id('Post',root_post_with_tags.id)
    variable_values = {
        "taggableId" : post_id,
        "value": "tag1"
    }

    res = schema.execute(u"""
        mutation addTag(
        $taggableId: ID!
        $value: String!
        ) {
        addTag(
            taggableId: $taggableId
            value: $value
        ) {
            tag {
                value
            }
            post {
                tags {
                    value
                }
            }
        }
        }
    """, context_value=graphql_request, variable_values=variable_values)

    assert json.loads(json.dumps(res.data)) == {
        u'addTag': {
        u'tag': {u'value': u'tag1'},
        u'post': {u'tags': [{u'value': u'tag1'}, {u'value': u'tag2'}]}
        }
    }
    assert len(root_post_with_tags.db.query(models.Keyword).all()) == 2


def test_remove_tag_on_post(graphql_request, tags, root_post_with_tags):
    post_id = to_global_id('Post',root_post_with_tags.id)
    tag_id = to_global_id('Keyword', tags[0].id)
    variable_values = {
        "taggableId" : post_id,
        "id": tag_id
    }

    res = schema.execute(u"""
        mutation removeTag(
        $taggableId: ID!
        $id: ID!
        ) {
        removeTag(
            taggableId: $taggableId
            id: $id
        ) {
            success
            post {
                tags {
                    value
                }
            }
        }
        }
    """, context_value=graphql_request, variable_values=variable_values)

    assert json.loads(json.dumps(res.data)) == {
        u'removeTag': {
        u'success': True,
        u'post': {u'tags': [{u'value': u'tag2'}]}
        }
    }
    assert len(root_post_with_tags.db.query(models.Keyword).all()) == 2


def test_get_tags_on_post(admin_user, graphql_request, discussion, root_post_with_tags):
    post_id = to_global_id('Post',root_post_with_tags.id)
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
        "id": post_id,
    })
    assert json.loads(json.dumps(res.data)) == {
        u'post': {
            u'tags': [
                {u'value': u'tag1'},
                {u'value': u'tag2'},
                ]
            }}