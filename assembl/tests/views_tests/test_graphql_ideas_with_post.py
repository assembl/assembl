# -*- coding: utf-8 -*-

from assembl.graphql.schema import Schema as schema


def test_idea_with_post_default(graphql_request, graphql_registry, idea_in_thread_phase, top_post_in_thread_phase,
                                second_post_in_thread_phase, third_post_in_thread_phase):
    res = schema.execute(
        graphql_registry['IdeaWithPostsQuery'],
        context_value=graphql_request,
        variable_values={"id": idea_in_thread_phase, "lang": "en", "additionalFields": True},
    )
    assert res.errors is None
    posts = res.data['idea']['posts']['edges']
    assert len(posts) == 3
    assert posts[0]['node']['subjectEntries'][0]['value'] == u"Troisième post"
    assert posts[-1]['node']['subjectEntries'][0]['value'] == u"Manger des choux à la crème"


def test_idea_with_post_reverse_chronological(graphql_request, graphql_registry, idea_in_thread_phase,
                                              top_post_in_thread_phase,
                                              second_post_in_thread_phase, third_post_in_thread_phase):
    res = schema.execute(
        graphql_registry['IdeaWithPostsQuery'],
        context_value=graphql_request,
        variable_values={"id": idea_in_thread_phase, "lang": "en", "additionalFields": True,
                         "postsOrder": "reverse_chronological"},
    )
    assert res.errors is None
    posts = res.data['idea']['posts']['edges']
    assert len(posts) == 3
    assert posts[0]['node']['subjectEntries'][0]['value'] == u"Troisième post"
    assert posts[-1]['node']['subjectEntries'][0]['value'] == u"Manger des choux à la crème"


def test_idea_with_post_chronological(graphql_request, graphql_registry, idea_in_thread_phase,
                                      top_post_in_thread_phase,
                                      second_post_in_thread_phase, third_post_in_thread_phase):
    res = schema.execute(
        graphql_registry['IdeaWithPostsQuery'],
        context_value=graphql_request,
        variable_values={"id": idea_in_thread_phase, "lang": "en", "additionalFields": True,
                         "postsOrder": "chronological"},
    )
    assert res.errors is None
    posts = res.data['idea']['posts']['edges']
    assert len(posts) == 3
    assert posts[0]['node']['subjectEntries'][0]['value'] == u"Manger des choux à la crème"
    assert posts[2]['node']['subjectEntries'][0]['value'] == u"Troisième post"
