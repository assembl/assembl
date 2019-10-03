# -*- coding: utf-8 -*-
from freezegun import freeze_time
from graphql_relay import from_global_id

from assembl.graphql.schema import Schema as schema
from assembl.tests.fixtures.graphql import create_post_in_thread


@freeze_time("2018-3-1")
def test_idea_hashtags(graphql_request, request, test_session,
                       graphql_registry, idea_in_thread_phase,
                       top_post_in_thread_phase,
                       second_post_in_thread_phase, third_post_in_thread_phase,
                       another_idea_in_thread_phase):
    from assembl.models import Post
    # top_post_in_thread_phase admin's post is an answer of participant1_post_in_thread_phase
    top_post_instance_id = int(from_global_id(top_post_in_thread_phase)[1])
    post = Post.get(top_post_instance_id)
    post.body.entries[0].value = "The quick brown #Fox jumps over the lazy #Dog."

    second_post_instance_id = int(from_global_id(second_post_in_thread_phase)[1])
    post2 = Post.get(second_post_instance_id)
    post2.body.entries[0].value = "The quick brown #fox jumps over the lazy #mouse."

    create_post_in_thread(title=u"post in other idea",
                          request=request,
                          graphql_request=graphql_request,
                          test_session=test_session,
                          body=u"This is #fake #news !",
                          idea_id=another_idea_in_thread_phase)
    post.db.flush()

    res = schema.execute(
        graphql_registry['HashtagsQuery'],
        context_value=graphql_request,
        variable_values={
            "ideaId": idea_in_thread_phase,
        },
    )

    assert res.errors is None
    assert res.data['hashtags'] == ['dog', 'fox', 'mouse']
