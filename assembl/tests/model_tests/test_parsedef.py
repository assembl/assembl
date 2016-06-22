# -*- coding: utf-8 -*-

from assembl.auth import P_SYSADMIN


def _test_load_fixture(test_webrequest, discussion, admin, fixture):
    test_webrequest.matchdict = {'discussion_slug': discussion.slug}
    json = fixture.generic_json(permissions=(P_SYSADMIN, ))
    print fixture.__dict__
    fixture.update_from_json(json, admin.id)
    print fixture.__dict__
    assert not discussion.db.is_modified(fixture, True)


def test_load_discussion(test_webrequest, discussion, admin_user):
    _test_load_fixture(test_webrequest, discussion, admin_user, discussion)


def test_load_participant1_user(
        test_webrequest, discussion, admin_user, participant1_user):
    _test_load_fixture(
        test_webrequest, discussion, admin_user, participant1_user)


def test_load_abstract_mailbox(
        test_webrequest, discussion, admin_user, abstract_mailbox):
    _test_load_fixture(
        test_webrequest, discussion, admin_user, abstract_mailbox)


def test_load_jack_layton_mailbox(
        test_webrequest, discussion, admin_user, jack_layton_mailbox):
    _test_load_fixture(
        test_webrequest, discussion, admin_user, jack_layton_mailbox)


def test_load_root_post_1(
        test_webrequest, discussion, admin_user, root_post_1):
    _test_load_fixture(
        test_webrequest, discussion, admin_user, root_post_1)


def test_load_subidea_1(test_webrequest, discussion, admin_user, subidea_1):
    _test_load_fixture(test_webrequest, discussion, admin_user, subidea_1)


def _test_load_synthesis_1(
        test_webrequest, discussion, admin_user, synthesis_1):
    _test_load_fixture(test_webrequest, discussion, admin_user, synthesis_1)


def _test_load_extract_post_1_to_subidea_1_1(
        test_webrequest, discussion, admin_user,
        extract_post_1_to_subidea_1_1):
    _test_load_fixture(
        test_webrequest, discussion, admin_user, extract_post_1_to_subidea_1_1)


def test_load_mailbox(
        test_webrequest, discussion, admin_user, jack_layton_mailbox):
    _test_load_fixture(
        test_webrequest, discussion, admin_user, jack_layton_mailbox)
