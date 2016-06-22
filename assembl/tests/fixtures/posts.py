import pytest
from datetime import datetime


@pytest.fixture(scope="function")
def root_post_1(request, participant1_user, discussion, test_session):
    """
    From participant1_user
    """
    from assembl.models import Post, LangString
    p = Post(
        discussion=discussion, creator=participant1_user,
        subject=LangString.create(u"a root post"),
        body=LangString.create(u"post body"), moderator=None,
        creation_date=datetime(year=2000, month=1, day=1),
        type="post", message_id="msg1@example.com")
    test_session.add(p)
    test_session.flush()

    def fin():
        print "finalizer root_post_1"
        test_session.delete(p)
        test_session.flush()
    request.addfinalizer(fin)
    return p


@pytest.fixture(scope="function")
def discussion2_root_post_1(request, participant1_user, discussion2, test_session):
    """
    From participant1_user
    """
    from assembl.models import Post, LangString
    p = Post(
        discussion=discussion2, creator=participant1_user,
        subject=LangString.create(u"a root post"),
        body=LangString.create(u"post body"),
        creation_date=datetime(year=2000, month=1, day=2),
        type="post", message_id="msg1@example2.com")
    test_session.add(p)
    test_session.flush()

    def fin():
        print "finalizer discussion2_root_post_1"
        test_session.delete(p)
        test_session.flush()
    request.addfinalizer(fin)
    return p


@pytest.fixture(scope="function")
def synthesis_post_1(request, participant1_user, discussion, test_session,
                     synthesis_1):
    """A Syntehsis Post fixture"""

    from assembl.models import SynthesisPost, LangString
    p = SynthesisPost(
        discussion=discussion, creator=participant1_user,
        subject=LangString.create(u"a synthesis post"),
        body=LangString.create(u"post body (unused, it's a synthesis...)"),
        message_id="msg1s@example.com",
        creation_date=datetime(year=2000, month=1, day=3),
        publishes_synthesis=synthesis_1)
    test_session.add(p)
    test_session.flush()

    def fin():
        print "finalizer synthesis_post_1"
        test_session.delete(p)
        test_session.flush()
    request.addfinalizer(fin)
    return p


@pytest.fixture(scope="function")
def reply_post_1(request, participant2_user, discussion,
                 root_post_1, test_session):
    """
    From participant2_user, in reply to root_post_1
    """
    from assembl.models import Post, LangString
    p = Post(
        discussion=discussion, creator=participant2_user,
        subject=LangString.create(u"re1: root post"),
        body=LangString.create(u"post body"),
        creation_date=datetime(year=2000, month=1, day=4),
        type="post", message_id="msg2@example.com")
    test_session.add(p)
    test_session.flush()
    p.set_parent(root_post_1)
    test_session.flush()

    def fin():
        print "finalizer reply_post_1"
        test_session.delete(p)
        test_session.flush()
    request.addfinalizer(fin)
    return p


@pytest.fixture(scope="function")
def reply_post_2(request, participant1_user, discussion,
                 reply_post_1, test_session):
    """
    From participant1_user, in reply to reply_post_1
    """
    from assembl.models import Post, LangString
    p = Post(
        discussion=discussion, creator=participant1_user,
        subject=LangString.create(u"re2: root post"),
        body=LangString.create(u"post body"),
        creation_date=datetime(year=2000, month=1, day=5),
        type="post", message_id="msg3@example.com")
    test_session.add(p)
    test_session.flush()
    p.set_parent(reply_post_1)
    test_session.flush()

    def fin():
        print "finalizer reply_post_2"
        test_session.delete(p)
        test_session.flush()
    request.addfinalizer(fin)
    return p


@pytest.fixture(scope="function")
def reply_post_3(request, participant2_user, discussion,
                 root_post_1, test_session):
    """
    From participant2_user, in reply to reply_post_2
    """
    from assembl.models import Post, LangString
    p = Post(
        discussion=discussion, creator=participant2_user,
        subject=LangString.create(u"re2: root post"),
        body=LangString.create(u"post body"),
        type="post", message_id="msg4@example.com")
    test_session.add(p)
    test_session.flush()
    p.set_parent(root_post_1)
    test_session.flush()

    def fin():
        print "finalizer reply_post_3"
        test_session.delete(p)
        test_session.flush()
    request.addfinalizer(fin)
    return p
