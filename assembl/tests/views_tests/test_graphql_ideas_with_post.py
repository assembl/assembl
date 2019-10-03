# -*- coding: utf-8 -*-
from graphql_relay import from_global_id

from assembl.graphql.schema import Schema as schema


def test_idea_with_posts_default(graphql_request, graphql_registry, idea_in_thread_phase, top_post_in_thread_phase,
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


def test_idea_with_posts_reverse_chronological(graphql_request, graphql_registry, idea_in_thread_phase,
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


def test_idea_with_posts_chronological(graphql_request, graphql_registry, idea_in_thread_phase,
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


def test_idea_with_posts_only_my_posts_admin(admin_user, graphql_request, graphql_registry, idea_in_thread_phase,
                                             top_post_in_thread_phase, participant1_post_in_thread_phase,
                                             ):
    res = schema.execute(
        graphql_registry['IdeaWithPostsQuery'],
        context_value=graphql_request,
        variable_values={"id": idea_in_thread_phase, "lang": "en", "additionalFields": True, "onlyMyPosts": True},
    )
    assert res.errors is None
    posts = res.data['idea']['posts']['edges']
    assert len(posts) == 1
    assert posts[0]['node']['creator']['displayName'] == 'mr_admin_user'
    assert posts[0]['node']['subjectEntries'][0]['value'] == u"Manger des choux à la crème"


def test_idea_with_posts_only_my_posts_participant1(graphql_request, graphql_registry, idea_in_thread_phase,
                                                    top_post_in_thread_phase, participant1_post_in_thread_phase,
                                                    participant1_user):
    graphql_request.authenticated_userid = participant1_user.id
    res = schema.execute(
        graphql_registry['IdeaWithPostsQuery'],
        context_value=graphql_request,
        variable_values={"id": idea_in_thread_phase, "lang": "en", "additionalFields": True, "onlyMyPosts": True},
    )
    assert res.errors is None
    posts = res.data['idea']['posts']['edges']
    assert len(posts) == 1
    assert posts[0]['node']['creator']['displayName'] == u"A. Barking Loon"
    assert posts[0]['node']['subjectEntries'][0]['value'] == u"Post de participant1"


def test_idea_with_posts_answers_to_my_posts_show_my_posts(graphql_request, graphql_registry, idea_in_thread_phase,
                                             top_post_in_thread_phase, participant1_post_in_thread_phase,
                                             participant1_user):
    graphql_request.authenticated_userid = participant1_user.id
    res = schema.execute(
        graphql_registry['IdeaWithPostsQuery'],
        context_value=graphql_request,
        variable_values={"id": idea_in_thread_phase, "lang": "en", "additionalFields": True,
                         "onlyMyPosts": False, "myPostsAndAnswers": True},
    )
    assert res.errors is None
    posts = res.data['idea']['posts']['edges']
    assert len(posts) == 1
    assert posts[0]['node']['creator']['displayName'] == u"A. Barking Loon"
    assert posts[0]['node']['subjectEntries'][0]['value'] == u"Post de participant1"


def test_idea_with_posts_answers_to_my_posts_show_answers(graphql_request, graphql_registry, idea_in_thread_phase,
                                             top_post_in_thread_phase, participant1_post_in_thread_phase,
                                             third_post_in_thread_phase, participant1_user):
    from assembl.models import Post
    # top_post_in_thread_phase admin's post is an answer of participant1_post_in_thread_phase
    participant_instance_id = int(from_global_id(participant1_post_in_thread_phase)[1])
    admin_instance_id = int(from_global_id(top_post_in_thread_phase)[1])
    Post.get(admin_instance_id).parent_id = participant_instance_id

    graphql_request.authenticated_userid = participant1_user.id
    res = schema.execute(
        graphql_registry['IdeaWithPostsQuery'],
        context_value=graphql_request,
        variable_values={"id": idea_in_thread_phase, "lang": "en", "additionalFields": True,
                         "onlyMyPosts": False, "myPostsAndAnswers": True},
    )
    assert res.errors is None
    posts = res.data['idea']['posts']['edges']
    assert len(posts) == 2


def test_idea_with_posts_hashtags_one(graphql_request, graphql_registry, idea_in_thread_phase, top_post_in_thread_phase,
                                      second_post_in_thread_phase, third_post_in_thread_phase):
    from assembl.models import Post
    # top_post_in_thread_phase admin's post is an answer of participant1_post_in_thread_phase
    top_post_instance_id = int(from_global_id(top_post_in_thread_phase)[1])
    post = Post.get(top_post_instance_id)
    post.body.entries[0].value = "The quick brown #fox jumps over the lazy #dog."
    post.db.flush()

    second_post_instance_id = int(from_global_id(second_post_in_thread_phase)[1])
    post2 = Post.get(second_post_instance_id)
    post2.body.entries[0].value = "The quick brown #fox jumps over the lazy #mouse."

    res = schema.execute(
        graphql_registry['IdeaWithPostsQuery'],
        context_value=graphql_request,
        variable_values={
            "id": idea_in_thread_phase,
            "additionalFields": True, "lang": "en", "hashtags": ['fox']
        },
    )
    assert res.errors is None
    posts = res.data['idea']['posts']['edges']
    assert len(posts) == 2

def test_idea_with_posts_hashtags_several(
    graphql_request,
    graphql_registry, idea_in_thread_phase, top_post_in_thread_phase,
    second_post_in_thread_phase, third_post_in_thread_phase):
    from assembl.models import Post
    # top_post_in_thread_phase admin's post is an answer of participant1_post_in_thread_phase
    top_post_instance_id = int(from_global_id(top_post_in_thread_phase)[1])
    post = Post.get(top_post_instance_id)
    post.body.entries[0].value = "The quick brown #fox jumps over the lazy #dog."

    second_post_instance_id = int(from_global_id(second_post_in_thread_phase)[1])
    post2 = Post.get(second_post_instance_id)
    post2.body.entries[0].value = "The quick brown #fox jumps over the lazy #mouse."

    post.db.flush()

    res = schema.execute(
        graphql_registry['IdeaWithPostsQuery'],
        context_value=graphql_request,
        variable_values={
            "id": idea_in_thread_phase,
            "additionalFields": True, "lang": "en", "hashtags": ['dog', 'fox']
        },
    )
    assert res.errors is None
    posts = res.data['idea']['posts']['edges']
    assert len(posts) == 1
