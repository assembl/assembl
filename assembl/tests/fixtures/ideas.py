import pytest


@pytest.fixture(scope="function")
def root_idea(request, discussion, test_session):
    """A root Idea fixture"""
    return discussion.root_idea


@pytest.fixture(scope="function")
def subidea_1(request, discussion, root_idea, test_session):
    """An Idea fixture with a idealink to root idea fixture -
    root_idea
        |-> subidea_1"""

    from assembl.models import Idea, IdeaLink
    i = Idea(short_title=u"Favor economic growth", discussion=discussion)
    test_session.add(i)
    l_r_1 = IdeaLink(source=root_idea, target=i)
    test_session.add(l_r_1)
    test_session.flush()

    def fin():
        print "finalizer subidea_1"
        test_session.delete(l_r_1)
        test_session.delete(i)
        test_session.flush()
    request.addfinalizer(fin)
    return i


@pytest.fixture(scope="function")
def subidea_1_1(request, discussion, subidea_1, test_session):
    """An Idea fixture with a idealink to subidea_1 fixture -
    root_idea
        |-> subidea_1
            |-> subidea_1_1"""

    from assembl.models import Idea, IdeaLink
    i = Idea(short_title=u"Lower taxes", discussion=discussion)
    test_session.add(i)
    l_1_11 = IdeaLink(source=subidea_1, target=i)
    test_session.add(l_1_11)
    test_session.flush()

    def fin():
        print "finalizer subidea_1_1"
        test_session.delete(l_1_11)
        test_session.delete(i)
        test_session.flush()
    request.addfinalizer(fin)
    return i


@pytest.fixture(scope="function")
def subidea_1_1_1(request, discussion, subidea_1_1, test_session):
    """An Idea fixture with a idealink to subidea_1_1 fixture -
    root_idea
        |-> subidea_1
            |-> subidea_1_1
                |-> subidea_1_1_1"""

    from assembl.models import Idea, IdeaLink
    i = Idea(short_title=u"Lower government revenue", discussion=discussion)
    test_session.add(i)
    l_11_111 = IdeaLink(source=subidea_1_1, target=i)
    test_session.add(l_11_111)
    test_session.flush()

    def fin():
        print "finalizer subidea_1_1_1"
        test_session.delete(l_11_111)
        test_session.delete(i)
        test_session.flush()
    request.addfinalizer(fin)
    return i


@pytest.fixture(scope="function")
def subidea_1_1_1_1(request, discussion, subidea_1_1_1, test_session):
    """An Idea fixture with a idealink to subidea_1_1_1 fixture -
    root_idea
        |-> subidea_1
            |-> subidea_1_1
                |-> subidea_1_1_1
                    |->subidea_1_1_1_1"""

    from assembl.models import Idea, IdeaLink
    i = Idea(short_title=u"Austerity yields contraction", discussion=discussion)
    test_session.add(i)
    l_111_1111 = IdeaLink(source=subidea_1_1_1, target=i)
    test_session.add(l_111_1111)
    test_session.flush()

    def fin():
        print "finalizer subidea_1_1_1_1"
        test_session.delete(l_111_1111)
        test_session.delete(i)
        test_session.flush()
    request.addfinalizer(fin)
    return i


@pytest.fixture(scope="function")
def subidea_1_1_1_1_1(request, discussion, subidea_1_1_1_1, test_session):
    """An Idea fixture with a idealink to subidea_1_1_1_1 fixture -
    root_idea
        |-> subidea_1
            |-> subidea_1_1
                |-> subidea_1_1_1
                    |-> subidea_1_1_1_1
                        |-> subidea_1_1_1_1"""

    from assembl.models import Idea, IdeaLink
    i = Idea(short_title=u"Job loss", discussion=discussion)
    test_session.add(i)
    l_1111_11111 = IdeaLink(source=subidea_1_1_1_1, target=i)
    test_session.add(l_1111_11111)
    test_session.flush()

    def fin():
        print "finalizer subidea_1_1_1_1_1_1"
        test_session.delete(l_1111_11111)
        test_session.delete(i)
        test_session.flush()
    request.addfinalizer(fin)
    return i


@pytest.fixture(scope="function")
def subidea_1_1_1_1_2(request, discussion, subidea_1_1_1_1, test_session):
    """An Idea fixture with a idealink to subidea_1_1_1_1 fixture -
    root_idea
        |-> subidea_1
            |-> subidea_1_1
                |-> subidea_1_1_1
                    |-> subidea_1_1_1_1
                        |-> subidea_1_1_1_1
                        |-> subidea_1_1_1_2"""

    from assembl.models import Idea, IdeaLink
    i = Idea(short_title=u"Environmental program cutns", discussion=discussion)
    test_session.add(i)
    l_1111_11112 = IdeaLink(source=subidea_1_1_1_1, target=i)
    test_session.add(l_1111_11112)
    test_session.flush()

    def fin():
        print "finalizer subidea_1_1_1_1_2"
        test_session.delete(l_1111_11112)
        test_session.delete(i)
        test_session.flush()
    request.addfinalizer(fin)
    return i


@pytest.fixture(scope="function")
def subidea_1_1_1_1_2_1(request, discussion, subidea_1_1_1_1_2, test_session):
    """An Idea fixture with a idealink to subidea_1_1_1_1_2 fixture -
    root_idea
        |-> subidea_1
            |-> subidea_1_1
                |-> subidea_1_1_1
                    |-> subidea_1_1_1_1
                        |-> subidea_1_1_1_1
                        |-> subidea_1_1_1_2
                            |-> subidea_1_1_1_1_2_1"""

    from assembl.models import Idea, IdeaLink
    i = Idea(short_title=u"Bad for the environment", discussion=discussion)
    test_session.add(i)
    l_11112_111121 = IdeaLink(source=subidea_1_1_1_1_2, target=i)
    test_session.add(l_11112_111121)
    test_session.flush()

    def fin():
        print "finalizer subidea_1_1_1_1_2_1"
        test_session.delete(l_11112_111121)
        test_session.delete(i)
        test_session.flush()
    request.addfinalizer(fin)
    return i


@pytest.fixture(scope="function")
def subidea_1_1_1_1_2_2(request, discussion, subidea_1_1_1_1_2, test_session):
    """An Idea fixture with a idealink to subidea_1_1_1_1_2 fixture -
    root_idea
        |-> subidea_1
            |-> subidea_1_1
                |-> subidea_1_1_1
                    |-> subidea_1_1_1_1
                        |-> subidea_1_1_1_1
                        |-> subidea_1_1_1_2
                            |-> subidea_1_1_1_1_2_1
                            |-> subidea_1_1_1_1_2_2"""

    from assembl.models import Idea, IdeaLink
    i = Idea(short_title=u"Federal programs are ineffective", discussion=discussion)
    test_session.add(i)
    l_11112_111122 = IdeaLink(source=subidea_1_1_1_1_2, target=i)
    test_session.add(l_11112_111122)
    test_session.flush()

    def fin():
        print "finalizer subidea_1_1_1_1_2_2"
        test_session.delete(l_11112_111122)
        test_session.delete(i)
        test_session.flush()
    request.addfinalizer(fin)
    return i


@pytest.fixture(scope="function")
def subidea_1_2(request, discussion, subidea_1, test_session):
    """An Idea fixture with a idealink to subidea_1 fixture -
    root_idea
        |-> subidea_1
            |-> subidea_1_2"""

    from assembl.models import Idea, IdeaLink
    i = Idea(short_title=u"Increased reseource consumption", discussion=discussion)
    test_session.add(i)
    l_1_12 = IdeaLink(source=subidea_1, target=i)
    test_session.add(l_1_12)
    test_session.flush()

    def fin():
        print "finalizer subidea_1_2"
        test_session.delete(l_1_12)
        test_session.delete(i)
        test_session.flush()
    request.addfinalizer(fin)
    return i


@pytest.fixture(scope="function")
def subidea_1_2_1(request, discussion, subidea_1_2, test_session):
    """An Idea fixture with a idealink to subidea_1 fixture -
    root_idea
        |-> subidea_1
            |-> subidea_1_2
                |-> subidea_1_2_1"""

    from assembl.models import Idea, IdeaLink
    i = Idea(short_title=u"Bad for the environment", discussion=discussion)
    test_session.add(i)
    l_12_121 = IdeaLink(source=subidea_1_2, target=i)
    test_session.add(l_12_121)
    test_session.flush()

    def fin():
        print "finalizer subidea_1_2_1"
        test_session.delete(l_12_121)
        test_session.delete(i)
        test_session.flush()
    request.addfinalizer(fin)
    return i
