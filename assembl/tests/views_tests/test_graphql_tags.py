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
