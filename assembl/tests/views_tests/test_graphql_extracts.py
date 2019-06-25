# -*- coding: utf-8 -*-
import json
import pytest

from graphql_relay.node.node import to_global_id, from_global_id
from sqlalchemy.orm import joinedload

from assembl import models
from assembl.graphql.schema import Schema as schema

def test_mutation_add_extract(graphql_request, tags, top_post_in_thread_phase):
  post_db_id = int(from_global_id(top_post_in_thread_phase)[1])
  
  contentLocale = u'fr'
  message_title = u"Manger des choux à la crème"
  extract_body = u"manger des choux à la crème"
  extract_author_name = u'Mr. Administrator'
  xpathStart = u"//div[@id='message-body-local:Content/%s']/" % post_db_id
  xpathEnd = xpathStart
  offsetStart = 17
  offsetEnd = 44
  important = False
  tags = ['tag1']
  isExtract = True

  variable_values = {
    "contentLocale": contentLocale,
    "postId": top_post_in_thread_phase,
    "body": extract_body,
    "important": important,
    "xpathStart": xpathStart,  
    "xpathEnd": xpathEnd,
    "offsetStart": offsetStart,
    "offsetEnd": offsetEnd,
    "tags": tags,
    "isExtract": isExtract
  }

  mutation = u"""
mutation addPostExtract(
  $contentLocale: String!
  $postId: ID!
  $body: String!
  $important: Boolean
  $xpathStart: String!
  $xpathEnd: String!
  $offsetStart: Int!
  $offsetEnd: Int!
  $tags: [String]
  $isExtract: Boolean!
) {
  addPostExtract(
    postId: $postId
    body: $body
    important: $important
    xpathStart: $xpathStart
    xpathEnd: $xpathEnd
    offsetStart: $offsetStart
    offsetEnd: $offsetEnd
    lang: $contentLocale
    tags: $tags
    isExtract: $isExtract
  ) {
    post {
      id
      parentId
      subjectEntries(lang: $contentLocale) {
        value
        localeCode
      }
      publicationState

      ... on Post {
        extracts {
          important
          body
          extractNature
          extractAction
          textFragmentIdentifiers {
            xpathStart
            xpathEnd
            offsetStart
            offsetEnd
          }
          creator { name }
          tags { value }
          isExtract
        }
      }
    }
  }
}
"""
  res = schema.execute(mutation, context_value=graphql_request, variable_values=variable_values)

  assert json.loads(json.dumps(res.data)) == {
    u'addPostExtract': {
      u'post': {
        u'extracts': [
          {
            u'body': extract_body, 
            u'creator': {
              u'name': extract_author_name
            }, 
            u'textFragmentIdentifiers': [
              {
                u'offsetStart': offsetStart, 
                u'offsetEnd': offsetEnd, 
                u'xpathEnd': xpathEnd, 
                u'xpathStart': xpathStart
              }
            ], 
            u'extractAction': None, 
            u'extractNature': None, 
            u'important': important,
            u'tags': [{u'value': u'tag1'}],
            u'isExtract': isExtract
          }
        ], 
        u'publicationState': 
        u'PUBLISHED', 
        u'subjectEntries': [
          {
            u'value': message_title, 
            u'localeCode': contentLocale
          }
        ], 
        u'parentId': None,
        u'id': top_post_in_thread_phase
      }
    }
  }

  res = schema.execute(mutation, context_value=graphql_request, variable_values=variable_values)
  assert res.errors and res.errors[0].message == "Extract already exists!"
  models.AssemblPost.get(post_db_id).extracts[0].tags = []


def test_mutation_delete_extract(graphql_request, extract_with_range_in_reply_post_1):
  extract_graphql_db_id = to_global_id('Extract',extract_with_range_in_reply_post_1.id)

  variable_values = {
    "extractId": extract_graphql_db_id
  }

  res = schema.execute(u"""
mutation deleteExtract($extractId: ID!) {
  deleteExtract(extractId: $extractId) {
    success
  }
}
""", context_value=graphql_request, variable_values=variable_values)

  assert json.loads(json.dumps(res.data)) == {
    u'deleteExtract': {
      u'success': True
    }
  }


def test_mutation_update_extract(graphql_request, extract_with_range_in_reply_post_1, reply_post_1):
  extract_graphql_db_id = to_global_id('Extract',extract_with_range_in_reply_post_1.id)
  post_db_id = reply_post_1.id
  
  extract_body = u"For the V-doped phases, an oxide-ion conduction mechanism is observed that involves oxygen exchange between the Bi-O sublattice and rapidly rotating VO4 tetrahedral units."
  xpathStart = u"//div[@id='message-body-local:Content/%s']/" % post_db_id
  xpathEnd = xpathStart
  # maybe TODO later if needed: expand updateExtract backend mutation so that it enables to modify offsetStart and offsetEnd
  offsetStart = 314 # a new value could be 486
  offsetEnd = 958 # a new value could be 1301
  important = True
  extractAction = "classify"
  extractNature = None

  variable_values = {
    "extractId": extract_graphql_db_id,
    "important": important,
    "extractNature": extractNature,
    "extractAction": extractAction,
    "body": extract_body
  }

  res = schema.execute(u"""
mutation updateExtract(
  $extractId: ID!
  $ideaId: ID
  $important: Boolean
  $extractNature: String
  $extractAction: String
  $body: String
) {
  updateExtract(
    extractId: $extractId
    ideaId: $ideaId
    body: $body
    important: $important
    extractNature: $extractNature
    extractAction: $extractAction
  ) {
    extract {
      important
      body
      extractNature
      extractAction
      textFragmentIdentifiers {
        xpathStart
        xpathEnd
        offsetStart
        offsetEnd
      }
      creator { name }
    }
  }
}
""", context_value=graphql_request, variable_values=variable_values)

  assert json.loads(json.dumps(res.data)) == {
    u'updateExtract': {
      u'extract': {
        u'body': extract_body,
        u'creator': {
          u'name': u'Maximilien de Robespierre'
        },
        u'textFragmentIdentifiers': [
          {
            u'offsetStart': offsetStart,
            u'offsetEnd': offsetEnd,
            u'xpathEnd': xpathEnd,
            u'xpathStart': xpathStart
          }
        ],
        u'extractAction': u'Enum.classify',
        u'extractNature': extractNature,
        u'important': important
      }
    }
  }


def test_mutation_update_extract_tags(graphql_request, extract_post_1_to_subidea_1_1):
  extract_graphql_db_id = to_global_id('Extract',extract_post_1_to_subidea_1_1.id)
  tags = ['foo', 'bar', 'tar']

  variable_values = {
    "id": extract_graphql_db_id,
    "tags" : tags
  }

  res = schema.execute(u"""
mutation updateExtractTags(
  $id: ID!
  $tags: [String]
) {
  updateExtractTags(
    id: $id
    tags: $tags
  ) {
    tags {
      value
    }
  }
}
""", context_value=graphql_request, variable_values=variable_values)

  assert json.loads(json.dumps(res.data)) == {
    u'updateExtractTags': {
      u'tags': [{u'value': u'foo'}, {u'value': u'bar'}, {u'value': u'tar'}]
    }
  }


def test_mutation_add_extracts(graphql_request, top_post_in_thread_phase):
  post_db_id = int(from_global_id(top_post_in_thread_phase)[1])
  
  extract_body = u"manger des choux à la crème"
  xpathStart = u"//div[@id='message-body-local:Content/%s']/" % post_db_id
  xpathEnd = xpathStart
  offsetStart = 17
  offsetEnd = 44

  variable_values = {
    "extracts": [
      {
        "postId": top_post_in_thread_phase,
        "body": extract_body,
        "xpathStart": xpathStart,  
        "xpathEnd": xpathEnd,
        "offsetStart": offsetStart,
        "offsetEnd": offsetEnd,
        "lang": "fr"
      }
    ],
    "extractState": "SUBMITTED",
    "extractNature": "actionable_solution" 
  }

  post = models.AssemblPost.get(post_db_id)
  db = post.db
  def get_extracts():
      return db.query(
        models.Extract
        ).join(
        models.Content, models.Extract.content == post
        ).options(joinedload(models.Extract.text_fragment_identifiers)).all()

  assert len(get_extracts()) == 0
  res = schema.execute(u"""
mutation AddPostsExtract($extracts: [PostExtractEntryInput]!, $extractState: ExtractStates, $extractNature: ExtractNatures) {
  addPostsExtract(extracts: $extracts, extractState: $extractState, extractNature: $extractNature) {
    status
  }
}
""", context_value=graphql_request, variable_values=variable_values)

  assert json.loads(json.dumps(res.data)) == {
    u'addPostsExtract': {
      u'status': True
    }
  }
  assert len(get_extracts()) == 1

  # add the same extract
  res = schema.execute(u"""
mutation AddPostsExtract($extracts: [PostExtractEntryInput]!, $extractState: ExtractStates, $extractNature: ExtractNatures) {
  addPostsExtract(extracts: $extracts, extractState: $extractState, extractNature: $extractNature) {
    status
  }
}
""", context_value=graphql_request, variable_values=variable_values)
  # The extract must be ignored
  assert len(get_extracts()) == 1


def test_mutation_confirm_extract(graphql_request, extract_with_range_submitted_in_reply_post_1):
  from assembl.models import ExtractStates
  state = extract_with_range_submitted_in_reply_post_1.extract_state
  assert ExtractStates.SUBMITTED.value == state
  extract_graphql_db_id = to_global_id('Extract',extract_with_range_submitted_in_reply_post_1.id)

  variable_values = {
    "extractId": extract_graphql_db_id
  }

  res = schema.execute(u"""
mutation confirmExtract($extractId: ID!) {
  confirmExtract(extractId: $extractId) {
    success
  }
}
""", context_value=graphql_request, variable_values=variable_values)

  assert json.loads(json.dumps(res.data)) == {
    u'confirmExtract': {
      u'success': True
    }
  }
  state = extract_with_range_submitted_in_reply_post_1.extract_state
  assert ExtractStates.PUBLISHED.value == state