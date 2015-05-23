# -*- coding: utf-8 -*-

from pyramid.threadlocal import manager
from ..auth import P_SYSADMIN


def _test_load_fixture(request, discussion, admin, fixture):
    manager.push({'request': request})
    request.matchdict = {'discussion_slug': discussion.slug}
    json = fixture.generic_json(permissions=(P_SYSADMIN, ))
    print fixture.__dict__
    fixture.update_from_json(json, admin.id)
    print fixture.__dict__
    assert not discussion.db.is_modified(fixture, True)


def test_load_discussion(request, discussion, admin_user):
    _test_load_fixture(request, discussion, admin_user, discussion)


def test_load_participant1_user(
        request, discussion, admin_user, participant1_user):
    _test_load_fixture(request, discussion, admin_user, participant1_user)


def test_load_post_source(request, discussion, admin_user, post_source):
    _test_load_fixture(request, discussion, admin_user, post_source)


def test_load_jack_layton_mailbox(
        request, discussion, admin_user, jack_layton_mailbox):
    _test_load_fixture(request, discussion, admin_user, jack_layton_mailbox)


def test_load_root_post_1(request, discussion, admin_user, root_post_1):
    _test_load_fixture(request, discussion, admin_user, root_post_1)


def test_load_subidea_1(request, discussion, admin_user, subidea_1):
    _test_load_fixture(request, discussion, admin_user, subidea_1)


def _test_load_synthesis_1(request, discussion, admin_user, synthesis_1):
    _test_load_fixture(request, discussion, admin_user, synthesis_1)


def _test_load_extract_post_1_to_subidea_1_1(
        request, discussion, admin_user, extract_post_1_to_subidea_1_1):
    _test_load_fixture(
        request, discussion, admin_user, extract_post_1_to_subidea_1_1)


def test_load_mailbox(
        request, discussion, admin_user, jack_layton_mailbox):
    _test_load_fixture(
        request, discussion, admin_user, jack_layton_mailbox)
