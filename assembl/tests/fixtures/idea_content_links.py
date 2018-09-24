# -*- coding: utf-8 -*-
import pytest


@pytest.fixture(scope="function")
def criterion_1(request, discussion, subidea_1, test_session):
    """An Idea fixture with IdeaLink to subidea_1"""

    from assembl.models import Idea, IdeaLink, LangString
    i = Idea(title=LangString.create(u"cost", 'en'),
             discussion=discussion)
    test_session.add(i)
    l_1_11 = IdeaLink(source=subidea_1, target=i)
    test_session.add(l_1_11)
    test_session.flush()

    def fin():
        print "finalizer criterion_1"
        test_session.delete(l_1_11)
        test_session.delete(i)
        test_session.flush()
    request.addfinalizer(fin)
    return i


@pytest.fixture(scope="function")
def criterion_2(request, discussion, subidea_1, test_session):
    """An Idea fixture with IdeaLink to subidea_1"""

    from assembl.models import Idea, IdeaLink, LangString
    i = Idea(title=LangString.create(u"quality", 'en'),
             discussion=discussion)
    test_session.add(i)
    l_1_11 = IdeaLink(source=subidea_1, target=i)
    test_session.add(l_1_11)
    test_session.flush()

    def fin():
        print "finalizer criterion_2"
        test_session.delete(l_1_11)
        test_session.delete(i)
        test_session.flush()
    request.addfinalizer(fin)
    return i


@pytest.fixture(scope="function")
def criterion_3(request, discussion, subidea_1, test_session):
    """An Idea fixture with IdeaLink to subidea_1"""

    from assembl.models import Idea, IdeaLink, LangString
    i = Idea(title=LangString.create(u"time", 'en'),
             discussion=discussion)
    test_session.add(i)
    l_1_11 = IdeaLink(source=subidea_1, target=i)
    test_session.add(l_1_11)
    test_session.flush()

    def fin():
        print "finalizer criterion_3"
        test_session.delete(l_1_11)
        test_session.delete(i)
        test_session.flush()
    request.addfinalizer(fin)
    return i


@pytest.fixture(scope="function")
def synthesis_1(request, discussion, subidea_1, subidea_1_1, test_session):
    """A Synthesis fixture"""

    from assembl.models import Synthesis, SubGraphIdeaAssociation,\
        SubGraphIdeaLinkAssociation, LangString

    ls_subject = LangString()
    ls_subject.add_value("subject FR", "fr")
    ls_subject.add_value("subject EN", "en")
    test_session.add(ls_subject)

    ls_introduction = LangString()
    ls_introduction.add_value("introduction FR", "fr")
    ls_introduction.add_value("introduction EN", "en")
    test_session.add(ls_introduction)

    ls_conclusion = LangString()
    ls_conclusion.add_value("conclusion FR", "fr")
    ls_conclusion.add_value("conclusion EN", "en")
    test_session.add(ls_conclusion)

    s = Synthesis(discussion=discussion, subject=ls_subject, introduction=ls_introduction, conclusion=ls_conclusion)
    test_session.add(s)

    i1_a = SubGraphIdeaAssociation(sub_graph=s, idea=subidea_1)
    test_session.add(i1_a)
    i11_a = SubGraphIdeaAssociation(sub_graph=s, idea=subidea_1_1)
    test_session.add(i11_a)
    l_1_11 = subidea_1_1.source_links[0]
    l_1_11_a = SubGraphIdeaLinkAssociation(sub_graph=s, idea_link=l_1_11)
    test_session.add(l_1_11_a)
    test_session.flush()

    def fin():
        print "finalizer synthesis_1"
        test_session.delete(l_1_11_a)
        test_session.delete(i11_a)
        test_session.delete(i1_a)
        test_session.delete(s)
        test_session.delete(ls_subject)
        test_session.delete(ls_introduction)
        test_session.delete(ls_conclusion)
        test_session.flush()
    request.addfinalizer(fin)

    return s


@pytest.fixture(scope="function")
def extract_post_1_to_subidea_1_1(
        request, participant2_user, reply_post_1,
        subidea_1_1, discussion, test_session):
    """ Links reply_post_1 to subidea_1_1 """

    from assembl.models import Extract
    from assembl.models.idea_content_link import ExtractNatureVocabulary, ExtractActionVocabulary
    e = Extract(
        body=u"body",
        creator=participant2_user,
        owner=participant2_user,
        content=reply_post_1,
        idea_id=subidea_1_1.id,  # strange bug: Using idea directly fails
        discussion=discussion,
        extract_hash=u'extract_post_1_to_subidea_1_1',
        extract_nature=ExtractNatureVocabulary.Enum.actionable_solution,
        extract_action=ExtractActionVocabulary.Enum.give_examples
    )
    test_session.add(e)
    test_session.flush()

    def fin():
        print "finalizer extract_post_1_to_subidea_1_1"
        test_session.delete(e)
        test_session.flush()
    request.addfinalizer(fin)
    return e


@pytest.fixture(scope="function")
def extract_with_range_in_reply_post_1(
        request, discussion_admin_user, reply_post_1,
        subidea_1_1, discussion, test_session):
    """ Create an extract of a given range of text in a message """

    from assembl.models import Extract, TextFragmentIdentifier

    extract_body = "variable-temperature spectra indicate the onset of oxide-ion motion involving the interstitials at 130 °C, which is linked to an orthorhombic−tetragonal phase transition. For the V-doped phases, an oxide-ion conduction mechanism is observed that involves oxygen exchange between the Bi-O sublattice and rapidly rotating VO4 tetrahedral units. The more poorly conducting P-doped phase exhibits only vacancy conduction with no evidence of sublattice exchange, a result ascribed to the differing propensities of the dopants to undergo variable oxygen coordination. So I think it would be a very bad idea to allow hot beverages in coworking spaces."
    xpathStart = u"//div[@id='message-body-local:Content/%s']/" % reply_post_1.id
    xpathEnd = xpathStart
    offsetStart = 314
    offsetEnd = 958
    lang = 'en'
    extract_hash = Extract.get_extract_hash(
        lang,
        xpathStart,
        xpathEnd,
        offsetStart,
        offsetEnd,
        reply_post_1.id
    )
    new_extract = Extract(
        creator_id=discussion_admin_user.id,
        owner_id=discussion_admin_user.id,
        discussion_id=discussion.id,
        body=extract_body,
        important=True,
        content=reply_post_1,
        extract_hash=extract_hash
    )
    new_extract.lang = lang
    test_session.add(new_extract)

    new_range = TextFragmentIdentifier(
        extract=new_extract,
        xpath_start=xpathStart,
        offset_start=offsetStart,
        xpath_end=xpathEnd,
        offset_end=offsetEnd
    )
    test_session.add(new_range)
    test_session.flush()

    def fin():
        print "finalizer extract_with_range_in_reply_post_1"
        test_session.delete(new_range)
        test_session.delete(new_extract)
        test_session.flush()
    request.addfinalizer(fin)

    return new_extract


@pytest.fixture(scope="function")
def extract_with_range_submitted_in_reply_post_1(
        request, discussion_admin_user, reply_post_1,
        subidea_1_1, discussion, test_session):
    """ Create an extract of a given range of text in a message """

    from assembl.models import Extract, TextFragmentIdentifier, ExtractStates

    extract_body = "variable-temperature spectra indicate the onset of oxide-ion motion involving the interstitials at 130 °C, which is linked to an orthorhombic−tetragonal phase transition. For the V-doped phases, an oxide-ion conduction mechanism is observed that involves oxygen exchange between the Bi-O sublattice and rapidly rotating VO4 tetrahedral units. The more poorly conducting P-doped phase exhibits only vacancy conduction with no evidence of sublattice exchange, a result ascribed to the differing propensities of the dopants to undergo variable oxygen coordination. So I think it would be a very bad idea to allow hot beverages in coworking spaces."
    xpathStart = u"//div[@id='message-body-local:Content/%s']/" % reply_post_1.id
    xpathEnd = xpathStart
    offsetStart = 314
    offsetEnd = 958
    lang = 'en'
    extract_hash = Extract.get_extract_hash(
        lang,
        xpathStart,
        xpathEnd,
        offsetStart,
        offsetEnd,
        reply_post_1.id
    )
    new_extract = Extract(
        creator_id=discussion_admin_user.id,
        owner_id=discussion_admin_user.id,
        discussion_id=discussion.id,
        body=extract_body,
        important=True,
        content=reply_post_1,
        extract_state=ExtractStates.SUBMITTED.value,
        extract_hash=extract_hash
    )
    new_extract.lang = lang
    test_session.add(new_extract)

    new_range = TextFragmentIdentifier(
        extract=new_extract,
        xpath_start=xpathStart,
        offset_start=offsetStart,
        xpath_end=xpathEnd,
        offset_end=offsetEnd
    )
    test_session.add(new_range)
    test_session.flush()

    def fin():
        print "finalizer extract_with_range_submitted_in_reply_post_1"
        test_session.delete(new_range)
        test_session.delete(new_extract)
        test_session.flush()
    request.addfinalizer(fin)

    return new_extract


@pytest.fixture(scope="function")
def extract_submitted_in_post_related_to_sub_idea_1_1_1(
        request, participant2_user, post_related_to_sub_idea_1_1_1,
        subidea_1_1, discussion, test_session):
    """ Create an extract in a post related to an idea."""

    from assembl.models import Extract
    from assembl.models.idea_content_link import ExtractNatureVocabulary, ExtractActionVocabulary

    new_extract = Extract(
        discussion_id=discussion.id,
        body=u"Commodi maiores magni rerum. Sint natus corporis in qui in ut dignissimos cumque repellendus. Reprehenderit nihil illum.",
        creator=participant2_user,
        owner=participant2_user,
        content=post_related_to_sub_idea_1_1_1,
        extract_hash=u'extract_submitted_in_post_related_to_sub_idea_1_1_1',
        extract_nature=ExtractNatureVocabulary.Enum.actionable_solution,
        extract_action=ExtractActionVocabulary.Enum.give_examples
    )
    test_session.add(new_extract)
    test_session.flush()

    def fin():
        print "finalizer extract_with_range_submitted_in_reply_post_1"
        test_session.delete(new_extract)
        test_session.flush()
    request.addfinalizer(fin)

    return new_extract


@pytest.fixture(scope="function")
def jack_layton_linked_discussion(
        request, test_session, jack_layton_mailbox, subidea_1, subidea_1_1,
        subidea_1_1_1, subidea_1_1_1_1, subidea_1_1_1_1_1, subidea_1_1_1_1_2,
        subidea_1_1_1_1_2_1, subidea_1_1_1_1_2_2, subidea_1_2, subidea_1_2_1,
        admin_user):
    """A Discussion fixture with ideas and idea links"""

    jack_layton_mailbox.do_import_content(jack_layton_mailbox, True)
    from assembl.models import (
        Post, IdeaContentPositiveLink, IdeaContentNegativeLink)
    posts = test_session.query(Post).order_by(Post.creation_date).all()
    posts.insert(0, None)  # We are using 1-offset indices below.
    links = [
        IdeaContentPositiveLink(idea=subidea_1, content=posts[1], creator=admin_user),
        IdeaContentNegativeLink(idea=subidea_1, content=posts[5], creator=admin_user),
        IdeaContentNegativeLink(idea=subidea_1, content=posts[16], creator=admin_user),
        IdeaContentPositiveLink(idea=subidea_1_1, content=posts[6], creator=admin_user),
        IdeaContentPositiveLink(idea=subidea_1_1_1, content=posts[18], creator=admin_user),
        IdeaContentPositiveLink(idea=subidea_1_1_1_1, content=posts[8], creator=admin_user),
        IdeaContentNegativeLink(idea=subidea_1_1_1_1, content=posts[16], creator=admin_user),
        IdeaContentPositiveLink(idea=subidea_1_1_1_1_1, content=posts[18], creator=admin_user),
        IdeaContentPositiveLink(idea=subidea_1_1_1_1_1, content=posts[15], creator=admin_user),
        IdeaContentNegativeLink(idea=subidea_1_1_1_1_1, content=posts[16], creator=admin_user),
        IdeaContentPositiveLink(idea=subidea_1_1_1_1_2, content=posts[19], creator=admin_user),
        IdeaContentPositiveLink(idea=subidea_1_1_1_1_2_1, content=posts[19], creator=admin_user),
        IdeaContentPositiveLink(idea=subidea_1_1_1_1_2_2, content=posts[20], creator=admin_user),
        IdeaContentPositiveLink(idea=subidea_1_2, content=posts[4], creator=admin_user),
        IdeaContentNegativeLink(idea=subidea_1_2, content=posts[16], creator=admin_user),
        IdeaContentPositiveLink(idea=subidea_1_2_1, content=posts[4], creator=admin_user),
        IdeaContentNegativeLink(idea=subidea_1_2_1, content=posts[16], creator=admin_user),
    ]
    for link in links:
        test_session.add(link)
    test_session.flush()

    def fin():
        for link in links:
            test_session.delete(link)
        test_session.flush()
    request.addfinalizer(fin)
    return links
