# -*- coding: utf-8 -*-
import json

from graphql_relay.node.node import to_global_id

from assembl import models
from assembl.graphql.schema import Schema as schema


def test_graphql_get_all_ideas(graphql_request, subidea_1_1_1):
    res = schema.execute(
        u"""query {
            ideas {
                ... on Idea {
                    id
                    title
                    titleEntries { value, localeCode }
                    shortTitle
                    numPosts
                    numContributors
                    parentId
                    order
                    posts(first:10) {
                        edges {
                            node {
                                ... on Post { subject body } } } } } } }
        """, context_value=graphql_request)
    assert len(res.data['ideas']) == 4
    root_idea = res.data['ideas'][0]
    first_idea = res.data['ideas'][1]
    second_idea = res.data['ideas'][2]
    third_idea = res.data['ideas'][3]
    assert root_idea['shortTitle'] is None
    assert root_idea['parentId'] is None
    assert root_idea['order'] is None
    assert first_idea['shortTitle'] == u'Favor economic growth'
    # title fallbacks to shortTitle if title field is really empty
    assert first_idea['title'] == u'Favor economic growth'
    assert first_idea['titleEntries'] == []
    assert first_idea['parentId'] == root_idea['id']
    assert first_idea['order'] == 0.0
    assert second_idea['shortTitle'] == u'Lower taxes'
    assert second_idea['parentId'] == first_idea['id']
    assert second_idea['order'] == 0.0
    assert third_idea['shortTitle'] == u'Lower government revenue'
    assert third_idea['parentId'] == second_idea['id']
    assert third_idea['order'] == 0.0
    assert len(res.errors) == 0


def test_graphql_get_direct_ideas_from_root_idea(graphql_request, subidea_1_1_1):
    res = schema.execute(
        u"""query {
            rootIdea {
              children {
                ... on Idea {
                    id
                    title
                    titleEntries { value, localeCode }
                    shortTitle
                    numPosts
                    numContributors
                    parentId
                    order
                    posts(first:10) {
                        edges {
                            node {
                                ... on Post { subject body } } } } } } } }
        """, context_value=graphql_request)
    assert len(res.data['rootIdea']['children']) == 1
    assert res.data['rootIdea']['children'][0]['title'] == u'Favor economic growth'


# this test works in isolation, but not with all tests...
def xtest_graphql_idea_content_links(jack_layton_linked_discussion, graphql_request):
    res = schema.execute(
        u"""query {
            ideas {
                ... on Idea {
                    id
                    title
                    titleEntries { value, localeCode }
                    shortTitle
                    numPosts
                    numContributors
                    parentId
                    order
                    posts(first:1) {
                        edges {
                            node {
                                ... on Post {
                                    ideaContentLinks { ideaId, type } subject body
        } } } } } } }
        """, context_value=graphql_request)
    idea_ids = [idea['id'] for idea in res.data['ideas']]
    idea_content_links = res.data['ideas'][0]['posts']['edges'][0]['node']['ideaContentLinks']
    assert len(idea_content_links) == 7
    assert idea_content_links[0]['ideaId'] in idea_ids
    assert idea_content_links[0]['type'] == u'IdeaContentPositiveLink'
