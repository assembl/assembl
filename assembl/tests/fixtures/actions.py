import pytest


@pytest.fixture(scope="function")
def simple_action(request, test_session, participant1_user):
    """A simple Action from the action abstract class"""
    from assembl.models.action import Action

    simple_action = Action(actor_id=participant1_user.id)

    test_session.add(simple_action)
    test_session.flush()

    def fin():
        print "Finalizing the simple_action fixture"
        test_session.delete(simple_action)
        test_session.flush()
    request.addfinalizer(fin)
    return simple_action


@pytest.fixture(scope="function")
def simple_ActionOnPost(request, test_session, simple_action, reply_post_3):
    from assembl.models.action import ActionOnPost
    simple_ActionOnPost = ActionOnPost(post_id=reply_post_3.id)

    test_session.add(simple_ActionOnPost)
    test_session.flush()

    def fin():
        print "Finalizing The simple_ActionOnPost fixture"
        test_session.delete(simple_ActionOnPost)
        test_session.flush()
    request.addfinalizer(fin)
    return simple_ActionOnPost


@pytest.fixture(scope="function")
def simple_UniqueActionOnPost(request, test_session, simple_ActionOnPost):
    from assembl.models.action import UniqueActionOnPost
    UniqueActionOnPost = UniqueActionOnPost()

    test_session.add(UniqueActionOnPost)
    test_session.flush()

    def fin():
        print "Finalizing UniqueActionOnPostFixture"
        test_session.delete(UniqueActionOnPost)
        test_session.flush()
    request.addfinalizer(fin)
    return UniqueActionOnPost


@pytest.fixture(scope="function")
def post_viewed(request, test_session, root_post_1, participant1_user):
    """A simple ViewPost action on root post 1 by non-admin user"""
    from assembl.models.action import ViewPost
    va = ViewPost(
        post_id=root_post_1.id,
        actor_id=participant1_user.id
    )

    test_session.add(va)
    test_session.flush()

    def fin():
        print "post_viewed finalizer is called"
        test_session.delete(va)
        test_session.flush()
    request.addfinalizer(fin)
    return va


@pytest.fixture(scope="function")
def post_viewed2(request, test_session, root_post_1, participant2_user):
    """A simple ViewPost action on reply post 1 by non admin user"""
    from assembl.models.action import ViewPost
    va = ViewPost(
        post_id=root_post_1.id,
        actor_id=participant2_user.id
    )

    test_session.add(va)
    test_session.flush()

    def fin():
        print "post_viewed finalizer is called"
        test_session.delete(va)
        test_session.flush()
    request.addfinalizer(fin)
    return va
