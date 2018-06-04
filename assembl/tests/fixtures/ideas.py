# -*- coding: utf-8 -*-
import pytest


@pytest.fixture(scope="function")
def root_idea(request, discussion, test_session):
    """A root Idea fixture"""
    return discussion.root_idea


@pytest.fixture(scope="function")
def idea_with_en_fr(request, discussion, en_locale,
                    fr_locale, test_session):
    """A top idea with english and french"""
    from assembl.models import Idea, LangString, LangStringEntry

    title = LangString.create(u'Title in english', 'en')
    title.add_entry(LangStringEntry(
                    locale=fr_locale,
                    value=u'Titre en français',
                    locale_confirmed=True))

    synthesis_title = LangString.create(u'What you need to know', 'en')
    synthesis_title.add_entry(LangStringEntry(
                              locale=fr_locale,
                              value=u'A retnir',
                              locale_confirmed=True))

    description = LangString.create(u'Idea description', 'en')
    description.add_entry(LangStringEntry(
                          locale=fr_locale,
                          value=u'Un Description',
                          locale_confirmed=True))

    idea = Idea(title=title,
                discussion=discussion,
                description=description,
                synthesis_title=synthesis_title)

    test_session.add(title)
    test_session.add(synthesis_title)
    test_session.add(description)
    test_session.add(idea)
    test_session.flush()

    def fin():
        print "finalizer idea_with_en_fr"
        test_session.delete(idea)
        test_session.delete(title)
        test_session.delete(synthesis_title)
        test_session.delete(description)
        test_session.flush()

    request.addfinalizer(fin)
    return idea


@pytest.fixture(scope="function")
def announcement_en_fr(request, discussion, en_locale,
                       fr_locale, admin_user, idea_with_en_fr,
                       test_session):
    from assembl.models import LangString, LangStringEntry, IdeaAnnouncement
    title = LangString.create(u'Announce title in English', 'en')
    title.add_entry(LangStringEntry(
                    locale=fr_locale,
                    value=u"Titre d'announce en français",
                    locale_confirmed=True))

    body = LangString.create(u'Announce body in English', 'en')
    body.add_entry(LangStringEntry(
                   locale=fr_locale,
                   value=u"Corps d'announce en français",
                   locale_confirmed=True))

    announce = IdeaAnnouncement(creator=admin_user,
                                last_updated_by=admin_user,
                                title=title,
                                body=body,
                                discussion=discussion,
                                idea=idea_with_en_fr)

    test_session.add(title)
    test_session.add(body)
    test_session.add(announce)
    test_session.flush()

    def fin():
        print "finalizer announcement_en_fr"
        test_session.delete(title)
        test_session.delete(body)
        test_session.delete(announce)
        test_session.flush()

    request.addfinalizer(fin)
    return announce


@pytest.fixture(scope="function")
def subidea_1(request, discussion, root_idea, test_session):
    """A subidea fixture with a idealink to root idea fixture::

        root_idea
            |-> subidea_1"""

    from assembl.models import Idea, IdeaLink, LangString
    i = Idea(title=LangString.create(u"Favor economic growth", 'en'),
             discussion=discussion,
             description=LangString.create("Some definition of an idea", 'en'))
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
    """An Idea fixture with a idealink to subidea_1 fixture::

        root_idea
            |-> subidea_1
                |-> subidea_1_1"""

    from assembl.models import Idea, IdeaLink, LangString
    i = Idea(title=LangString.create(u"Lower taxes", 'en'),
             discussion=discussion,
             description=LangString.create("Some definition of an idea", 'en'))
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
def subidea_1_2(request, discussion, subidea_1, test_session):
    """A subidea fixture with idealink to subidea_1 fixture"""
    from assembl.models import Idea, IdeaLink, LangString
    i = Idea(title=LangString.create(u"Even lower taxes", 'en'),
             discussion=discussion,
             description=LangString.create("The definition of the subidea_1_2", 'en'))
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
def subidea_1_1_1(request, discussion, subidea_1_1, test_session):
    """An Idea fixture with a idealink to subidea_1_1 fixture::

        root_idea
            |-> subidea_1
                |-> subidea_1_1
                    |-> subidea_1_1_1"""

    from assembl.models import Idea, IdeaLink, LangString
    i = Idea(title=LangString.create(u"Lower government revenue", 'en'),
             discussion=discussion,
             description=LangString.create("Some definition of an idea", 'en'))
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
    """An Idea fixture with a idealink to subidea_1_1_1 fixture::

        root_idea
            |-> subidea_1
                |-> subidea_1_1
                    |-> subidea_1_1_1
                        |->subidea_1_1_1_1"""

    from assembl.models import Idea, IdeaLink, LangString
    i = Idea(title=LangString.create(u"Austerity yields contraction", 'en'),
             discussion=discussion,
             description=LangString.create("Some definition of an idea", 'en'))
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
    """An Idea fixture with a idealink to subidea_1_1_1_1 fixture::

        root_idea
            |-> subidea_1
                |-> subidea_1_1
                    |-> subidea_1_1_1
                        |-> subidea_1_1_1_1
                            |-> subidea_1_1_1_1"""

    from assembl.models import Idea, IdeaLink, LangString
    i = Idea(title=LangString.create(u"Job loss", 'en'),
             discussion=discussion,
             description=LangString.create("Some definition of an idea", 'en'))
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
    """An Idea fixture with a idealink to subidea_1_1_1_1 fixture::

        root_idea
            |-> subidea_1
                |-> subidea_1_1
                    |-> subidea_1_1_1
                        |-> subidea_1_1_1_1
                            |-> subidea_1_1_1_1
                            |-> subidea_1_1_1_2"""

    from assembl.models import Idea, IdeaLink, LangString
    i = Idea(title=LangString.create(u"Environmental program cuts", 'en'),
             discussion=discussion,
             description=LangString.create("Some definition of an idea", 'en'))
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
    """An Idea fixture with a idealink to subidea_1_1_1_1_2 fixture::

        root_idea
            |-> subidea_1
                |-> subidea_1_1
                    |-> subidea_1_1_1
                        |-> subidea_1_1_1_1
                            |-> subidea_1_1_1_1
                            |-> subidea_1_1_1_2
                                |-> subidea_1_1_1_1_2_1"""

    from assembl.models import Idea, IdeaLink, LangString
    i = Idea(title=LangString.create(u"Bad for the environment", 'en'),
             discussion=discussion,
             description=LangString.create("Some definition of an idea", 'en'))
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
    """An Idea fixture with a idealink to subidea_1_1_1_1_2 fixture::

        root_idea
            |-> subidea_1
                |-> subidea_1_1
                    |-> subidea_1_1_1
                        |-> subidea_1_1_1_1
                            |-> subidea_1_1_1_1
                            |-> subidea_1_1_1_2
                                |-> subidea_1_1_1_1_2_1
                                |-> subidea_1_1_1_1_2_2"""

    from assembl.models import Idea, IdeaLink, LangString
    i = Idea(title=LangString.create(u"Federal programs are ineffective", 'en'),
             discussion=discussion,
             description=LangString.create("Some definition of an idea", 'en'))
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
    """An Idea fixture with a idealink to subidea_1 fixture::

        root_idea
            |-> subidea_1
                |-> subidea_1_2"""

    from assembl.models import Idea, IdeaLink, LangString
    i = Idea(title=LangString.create(u"Increased reseource consumption", 'en'),
             discussion=discussion,
             description=LangString.create("Some definition of an idea", 'en'))
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
    """An Idea fixture with a idealink to subidea_1 fixture::

        root_idea
            |-> subidea_1
                |-> subidea_1_2
                    |-> subidea_1_2_1"""

    from assembl.models import Idea, IdeaLink, LangString
    i = Idea(title=LangString.create(u"Bad for the environment", 'en'),
             discussion=discussion,
             description=LangString.create("Some definition of an idea", 'en'))
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
