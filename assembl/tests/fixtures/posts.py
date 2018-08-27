# -*- coding: utf-8 -*-

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
def root_post_1_with_positive_message_classifier(request, participant1_user,
                                                 idea_message_column_positive,
                                                 discussion, test_session):
    """
    From participant1_user
    """
    from assembl.models import Post, LangString
    p = Post(
        discussion=discussion, creator=participant1_user,
        subject=LangString.create(u"a root post"),
        body=LangString.create(u"post body"), moderator=None,
        creation_date=datetime(year=2000, month=1, day=1),
        type="post", message_id="msg1@example.com",
        message_classifier=idea_message_column_positive.message_classifier)
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
def root_post_en_under_positive_column_of_idea(
        request, test_session, discussion, admin_user,
        idea_message_column_positive):
    from assembl.models import Post, LangString, IdeaRelatedPostLink
    idea = idea_message_column_positive.idea
    p = Post(
        discussion=discussion, creator=admin_user,
        subject=LangString.create(u"A simple positive subject"),
        body=LangString.create(u"A simple positive body"),
        type='post', message_id="msg2@example3.com",
        message_classifier=idea_message_column_positive.message_classifier)

    idc = IdeaRelatedPostLink(
        idea=idea,
        creator=admin_user,
        content=p)

    test_session.add(p)
    test_session.add(idc)
    test_session.flush()

    def fin():
        print "finalizer root_post_en_under_positive_column_of_idea"
        test_session.delete(p)
        test_session.delete(idc)
        test_session.flush()

    request.addfinalizer(fin)
    return p


@pytest.fixture(scope="function")
def root_post_en_under_positive_column_of_subidea_1_1(
        request, test_session, discussion, admin_user,
        idea_message_column_positive_on_subidea_1_1):
    from assembl.models import Post, LangString, IdeaRelatedPostLink
    idea = idea_message_column_positive_on_subidea_1_1.idea
    p = Post(
        discussion=discussion, creator=admin_user,
        subject=LangString.create(u"A simple root post under positive column of subidea_1_1"),
        body=LangString.create(u"A simple root post under positive column of subidea_1_1"),
        type='post', message_id="msg2@example3.com",
        message_classifier=idea_message_column_positive_on_subidea_1_1.message_classifier)

    idc = IdeaRelatedPostLink(
        idea=idea,
        creator=admin_user,
        content=p)

    test_session.add(p)
    test_session.add(idc)
    test_session.flush()

    def fin():
        print "finalizer root_post_en_under_positive_column_of_subidea_1_1"
        test_session.delete(p)
        test_session.delete(idc)
        test_session.flush()

    request.addfinalizer(fin)
    return p


@pytest.fixture(scope="function")
def root_post_en_under_negative_column_of_subidea_1_1(
        request, test_session, discussion, admin_user,
        idea_message_column_negative_on_subidea_1_1):
    from assembl.models import Post, LangString, IdeaRelatedPostLink
    idea = idea_message_column_negative_on_subidea_1_1.idea
    p = Post(
        discussion=discussion, creator=admin_user,
        subject=LangString.create(u"A simple root post under negative column of subidea_1_1"),
        body=LangString.create(u"A simple root post under negative column of subidea_1_1"),
        type='post', message_id="msg2@example3.com",
        message_classifier=idea_message_column_negative_on_subidea_1_1.message_classifier)

    idc = IdeaRelatedPostLink(
        idea=idea,
        creator=admin_user,
        content=p)

    test_session.add(p)
    test_session.add(idc)
    test_session.flush()

    def fin():
        print "finalizer root_post_en_under_negative_column_of_subidea_1_1"
        test_session.delete(p)
        test_session.delete(idc)
        test_session.flush()

    request.addfinalizer(fin)
    return p


@pytest.fixture(scope="function")
def post_related_to_sub_idea_1(
        request, test_session, discussion, admin_user, subidea_1):
    from assembl.models import Post, LangString, IdeaRelatedPostLink
    idea = subidea_1
    p = Post(
        discussion=discussion, creator=admin_user,
        subject=LangString.create(u"A post related to sub_idea_1 "),
        body=LangString.create(u"A post related to sub_idea_1"),
        type='post', message_id="msg3@example3.com")

    idc = IdeaRelatedPostLink(
        idea=idea,
        creator=admin_user,
        content=p)

    test_session.add(p)
    test_session.add(idc)
    test_session.flush()

    def fin():
        print "finalizer root_post_en_under_positive_column_of_idea"
        test_session.delete(p)
        test_session.delete(idc)
        test_session.flush()

    request.addfinalizer(fin)
    return p


@pytest.fixture(scope="function")
def post_related_to_sub_idea_1_1_1(
        request, test_session, discussion, admin_user, subidea_1_1_1):
    from assembl.models import Post, LangString, IdeaRelatedPostLink
    idea = subidea_1_1_1
    p = Post(
        discussion=discussion, creator=admin_user,
        subject=LangString.create(u"A post subject related to sub_idea_1_1_1"),
        body=LangString.create(u"A post body related to sub_idea_1_1_1"),
        creation_date=datetime(2018, 2, 17, 9, 0, 0),  # in the thread phase date range (see phases fixture)
        type='post', message_id="msg3@example3.com")

    idc = IdeaRelatedPostLink(
        idea=idea,
        creator=admin_user,
        content=p)

    test_session.add(p)
    test_session.add(idc)
    test_session.flush()

    def fin():
        print "finalizer post_related_to_sub_idea_1_1_1"
        test_session.delete(p)
        test_session.delete(idc)
        test_session.flush()

    request.addfinalizer(fin)
    return p


@pytest.fixture(scope="function")
def root_post_en_under_negative_column_of_idea(
        request, test_session, discussion, admin_user,
        idea_message_column_negative):
    from assembl.models import Post, LangString, IdeaRelatedPostLink
    idea = idea_message_column_negative.idea
    p = Post(
        discussion=discussion, creator=admin_user,
        subject=LangString.create(u"A simple negative subject"),
        body=LangString.create(u"A simple negative body"),
        type='post', message_id="msg3@example3.com",
        message_classifier=idea_message_column_negative.message_classifier)

    idc = IdeaRelatedPostLink(
        idea=idea,
        creator=admin_user,
        content=p)

    test_session.add(p)
    test_session.add(idc)
    test_session.flush()

    def fin():
        print "finalizer root_post_en_under_positive_column_of_idea"
        test_session.delete(p)
        test_session.delete(idc)
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
        # Changing the date might affect tests involving phases
        creation_date=datetime(year=2020, month=1, day=3),
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
        body=LangString.create(u"post body with some text so we can test harvesting features. I'm writing a very topical comment with an unrelated source, hoping it would make people angry and make them write answers. I have read in '17O Solid-State NMR Spectroscopy of Functional Oxides for Energy Conversion' thesis by Halat, D. M. (2018) that variable-temperature spectra indicate the onset of oxide-ion motion involving the interstitials at 130 °C, which is linked to an orthorhombic−tetragonal phase transition. For the V-doped phases, an oxide-ion conduction mechanism is observed that involves oxygen exchange between the Bi-O sublattice and rapidly rotating VO4 tetrahedral units. The more poorly conducting P-doped phase exhibits only vacancy conduction with no evidence of sublattice exchange, a result ascribed to the differing propensities of the dopants to undergo variable oxygen coordination. So I think it would be a very bad idea to allow hot beverages in coworking spaces. But it looks like people don't really care about scientific evidence around here."),
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


@pytest.fixture(scope="function")
def reply_deleted_post_4(request, participant2_user, discussion,
                         reply_post_1, test_session):
    """
    From participant2_user, in reply to reply_post_1
    """
    from assembl.models import Post, LangString, PublicationStates
    p = Post(
        discussion=discussion, creator=participant2_user,
        subject=LangString.create(u"re2: root post"),
        body=LangString.create(u"post body"),
        publication_state=PublicationStates.DELETED_BY_ADMIN,
        type="post", message_id="msg5@example.com")
    test_session.add(p)
    test_session.flush()
    p.set_parent(reply_post_1)
    test_session.flush()

    def fin():
        print "finalizer reply_deleted_post_4"
        test_session.delete(p)
        test_session.flush()
    request.addfinalizer(fin)
    return p


@pytest.fixture(scope="function")
def reply_to_deleted_post_5(
        request, participant1_user, discussion,
        reply_deleted_post_4, test_session):
    """
    From participant2_user, in reply to root_post_1
    """
    from assembl.models import Post, LangString
    p = Post(
        discussion=discussion, creator=participant1_user,
        subject=LangString.create(u"re3: root post"),
        body=LangString.create(u"post body"),
        type="post", message_id="msg6@example.com")
    test_session.add(p)
    test_session.flush()
    p.set_parent(reply_deleted_post_4)
    test_session.flush()

    def fin():
        print "finalizer reply_to_deleted_post_5"
        test_session.delete(p)
        test_session.flush()
    request.addfinalizer(fin)
    return p


@pytest.fixture(scope="function")
def fully_ambiguous_post(
        request, test_session, discussion, participant1_user,
        undefined_locale, fr_locale, en_locale):
    from assembl.models import Content, LangString
    p = Content(
        discussion=discussion,
        subject=LangString.create(u"testa"),
        body=LangString.create(u"testa"))
    test_session.add(p)
    test_session.flush()

    def fin():
        print "finalizer fully_ambiguous_post"
        test_session.delete(p)
        test_session.flush()
    request.addfinalizer(fin)
    return p


@pytest.fixture(scope="function")
def post_subject_locale_determined_by_body(
        request, test_session, discussion,
        undefined_locale, fr_locale, en_locale):
    from assembl.models import Content, LangString
    p = Content(
        discussion=discussion,
        subject=LangString.create(u"testa"),
        body=LangString.create(u"Contenu clairement en français"))
    test_session.add(p)
    test_session.flush()

    def fin():
        print "finalizer post_subject_locale_determined_by_body"
        test_session.delete(p)
        test_session.flush()
    request.addfinalizer(fin)
    return p


@pytest.fixture(scope="function")
def post_body_locale_determined_by_creator(
        request, test_session, discussion, admin_user,
        user_language_preference_fr_cookie,
        undefined_locale, fr_locale, en_locale):
    from assembl.models import Post, LangString
    p = Post(
        discussion=discussion, creator=admin_user,
        subject=LangString.create(u"testa"),
        body=LangString.create(u"testa"),
        message_id="msg9@example.com")
    test_session.add(p)
    test_session.flush()

    def fin():
        print "finalizer post_subject_locale_determined_by_creator"
        test_session.delete(p)
        test_session.flush()
    request.addfinalizer(fin)
    return p


@pytest.fixture(scope="function")
def post_body_locale_determined_by_import(
        request, test_session, discussion, admin_user, mailbox,
        undefined_locale, fr_locale, en_locale):
    from assembl.models import Email, LangString
    p = Email(
        discussion=discussion, creator=admin_user,
        subject=LangString.create(u"testa"),
        body=LangString.create(u"testa"),
        source=mailbox,
        body_mime_type="text/plain",
        sender="admin@assembl.com",
        recipients="whoever@example.com",
        message_id="msg10@example.com",
        imported_blob="""Subject: testa
From: Mr. Administrator <admin@assembl.com>
Content-Language: fr
Content-Type: text/plain; charset="iso-8859-1"

testa""")
    # must be done after the source is set
    p.source_post_id = "msg10@example.com"
    test_session.add(p)
    test_session.flush()

    def fin():
        print "finalizer post_subject_locale_determined_by_creator"
        test_session.delete(p)
        test_session.flush()
    request.addfinalizer(fin)
    return p
