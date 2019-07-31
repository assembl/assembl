# -*- coding: utf-8 -*-
import pytest

@pytest.fixture(scope="function")
def reply_1_sentiments(request, participant1_user, discussion, test_session, reply_post_1):
    """
    From participant1_user
    """
    from assembl.models.action import (
    DisagreeSentimentOfPost, DontUnderstandSentimentOfPost)

    dislike = DisagreeSentimentOfPost(
        post=reply_post_1, discussion=discussion, actor_id=participant1_user.id)
    dont = DontUnderstandSentimentOfPost(
        post=reply_post_1, discussion=discussion, actor_id=participant1_user.id)
    test_session.add(dislike)
    test_session.add(dont)
    test_session.flush()

    def fin():
        print "finalizer root_post_1"
        test_session.delete(dislike)
        test_session.delete(dont)
        test_session.flush()
    request.addfinalizer(fin)
    return dislike


@pytest.fixture(scope="function")
def reply_2_sentiments(request, participant2_user, discussion, test_session, reply_post_2):
    """
    From participant1_user
    """
    from assembl.models.action import (
    DontUnderstandSentimentOfPost, MoreInfoSentimentOfPost, LikeSentimentOfPost)

    like = LikeSentimentOfPost(
        post=reply_post_2, discussion=discussion, actor_id=participant2_user.id)
    more = MoreInfoSentimentOfPost(
        post=reply_post_2, discussion=discussion, actor_id=participant2_user.id)
    dont = DontUnderstandSentimentOfPost(
        post=reply_post_2, discussion=discussion, actor_id=participant2_user.id)
    test_session.add(like)
    test_session.add(more)
    test_session.add(dont)
    test_session.flush()

    def fin():
        print "finalizer root_post_1"
        test_session.delete(like)
        test_session.delete(more)
        test_session.delete(dont)
        test_session.flush()
    request.addfinalizer(fin)
    return more
