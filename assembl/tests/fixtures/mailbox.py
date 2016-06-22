import pytest


@pytest.fixture(scope="function")
def mailbox(request, discussion, test_session):
    """An AbstractMailbox fixture"""

    from assembl.models import AbstractMailbox
    m = AbstractMailbox(
        discussion=discussion, name='mailbox')
    test_session.add(m)
    test_session.flush()

    def fin():
        print "finalizer mailbox"
        test_session.delete(m)
        test_session.flush()
    request.addfinalizer(fin)
    return m


@pytest.fixture(scope="function")
def jack_layton_mailbox(request, discussion, test_session):
    """A full mailbox fixture, taken from
    https://dev.imaginationforpeople.org/redmine/projects/assembl/wiki/SampleDebate
    """

    import os
    from assembl.models import MaildirMailbox
    maildir_path = os.path.join(os.path.dirname(__file__),
                                'jack_layton_fixtures_maildir')
    m = MaildirMailbox(discussion=discussion, name='Jack Layton fixture',
                       filesystem_path=maildir_path)
    m.do_import_content(m, only_new=True)
    test_session.add(m)
    test_session.flush()

    def fin():
        print "finalizer jack_layton_mailbox"
        agents = set()
        for post in m.contents:
            agents.add(post.creator)
            test_session.delete(post)
        for agent in agents:
            test_session.delete(agent)
        test_session.delete(m)
        test_session.flush()
    request.addfinalizer(fin)
    return m


@pytest.fixture(scope="function")
def abstract_mailbox(request, discussion, test_session):
    """An AbstractMailbox fixture with type of abstract_mailbox"""

    from assembl.models import AbstractMailbox
    ps = AbstractMailbox(
        discussion=discussion, name='a source', type='abstract_mailbox')
    test_session.add(ps)
    test_session.flush()

    def fin():
        print "finalizer abstract_mailbox"
        test_session.delete(ps)
        test_session.flush()
    request.addfinalizer(fin)
    return ps
