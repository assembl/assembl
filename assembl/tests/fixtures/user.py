from datetime import datetime

import pytest
from pyramid import testing
from pyramid.threadlocal import manager

from assembl.auth import R_MODERATOR, R_PARTICIPANT
from assembl.lib.config import get_config
from ..utils import PyramidWebTestRequest


@pytest.fixture(scope="function")
def participant1_user(request, test_session, discussion):
    """A User fixture with R_PARTICIPANT global role and with R_PARTICIPANT local role in discussion `discussion`"""

    from assembl.models import User, UserRole, Role, EmailAccount
    u = User(name=u"A. Barking Loon", type="user", password="password",
             verified=True, last_assembl_login=datetime.utcnow())

    email = EmailAccount(email="abloon@gmail.com", profile=u, verified=True)
    test_session.add(u)
    r = Role.get_role(R_PARTICIPANT, test_session)
    ur = UserRole(user=u, role=r)
    test_session.add(ur)
    u.subscribe(discussion)
    test_session.flush()

    def fin():
        print "finalizer participant1_user"
        test_session.delete(u)
        test_session.flush()
    request.addfinalizer(fin)
    return u


@pytest.fixture(scope="function")
def participant1_username(request, test_session, participant1_user):
    """A username for participant1_user"""
    from assembl.models import Username
    username = Username(user=participant1_user, username="Test.Username")
    test_session.add(username)
    test_session.flush()

    def fin():
        print "finalizer participant1_username"
        test_session.delete(username)
        test_session.flush()
    request.addfinalizer(fin)
    return username


@pytest.fixture(scope="function")
def test_participant1_webrequest(request, participant1_user, test_app_no_perm):
    """A Pyramid request fixture with an ADMIN user authorized"""
    req = PyramidWebTestRequest.blank('/', method="GET")
    req.authenticated_userid = participant1_user.id

    def fin():
        # The request was not called
        manager.pop()
    request.addfinalizer(fin)
    return req


@pytest.fixture(scope="function")
def test_app_participant1(request, participant1_user, test_app_no_perm):
    """A configured Assembl fixture with permissions
    and an participant1 user logged in"""

    config = testing.setUp(
        registry=test_app_no_perm.app.registry,
        settings=get_config(),
    )
    dummy_policy = config.testing_securitypolicy(
        userid=participant1_user.id, permissive=True)
    config.set_authorization_policy(dummy_policy)
    config.set_authentication_policy(dummy_policy)
    return test_app_no_perm


@pytest.fixture(scope="function")
def participant2_user(request, test_session):
    """A User fixture with R_PARTICIPANT global role"""

    from assembl.models import User, UserRole, Role
    u = User(name=u"James T. Expert", type="user",
             last_assembl_login=datetime.utcnow())
    test_session.add(u)
    r = Role.get_role(R_PARTICIPANT, test_session)
    ur = UserRole(user=u, role=r)
    test_session.add(ur)
    test_session.flush()

    def fin():
        print "finalizer participant2_user"
        test_session.delete(u)
        test_session.flush()
    request.addfinalizer(fin)
    return u


@pytest.fixture(scope="function")
def discussion_admin_user(request, test_app, test_session, discussion):
    """A User fixture with R_ADMINISTRATOR role in a discussion"""
    from datetime import datetime
    from assembl.auth import R_ADMINISTRATOR
    from assembl.models import User
    from assembl.models.auth import Role, LocalUserRole

    u = User(name=u"Maximilien de Robespierre", type="user",
             last_assembl_login=datetime.utcnow())
    test_session.add(u)

    u.update_agent_status_last_visit(discussion)
    role = Role.get_role(R_ADMINISTRATOR, test_session)
    test_session.add(
        LocalUserRole(user=u, discussion=discussion, role=role))
    test_session.flush()

    def fin():
        print "finalizer discussion_admin_user"
        test_session.delete(u)
        test_session.flush()
    request.addfinalizer(fin)

    return u


@pytest.fixture(scope="function")
def discussion_admin_user_2(request, test_app, test_session, discussion):
    """A User fixture with R_ADMINISTRATOR role in a discussion"""
    from datetime import datetime
    from assembl.auth import R_ADMINISTRATOR
    from assembl.models import User
    from assembl.models.auth import Role, LocalUserRole

    u = User(name=u"Maximilien de Robespierre 2", type="user",
             last_assembl_login=datetime.utcnow())
    test_session.add(u)

    u.update_agent_status_last_visit(discussion)
    role = Role.get_role(R_ADMINISTRATOR, test_session)
    test_session.add(
        LocalUserRole(user=u, discussion=discussion, role=role))
    test_session.flush()

    def fin():
        print "finalizer discussion_admin_user_2"
        test_session.delete(u)
        test_session.flush()
    request.addfinalizer(fin)

    return u


@pytest.fixture(scope="function")
def discussion_sysadmin_user(request, test_app, test_session, discussion):
    """A User fixture with R_SYSADMIN role in a discussion"""
    from datetime import datetime
    from assembl.auth import R_SYSADMIN
    from assembl.models import User
    from assembl.models.auth import Role, LocalUserRole, UserRole

    u = User(name=u"Maximilien de Robespierre 3", type="user",
             last_assembl_login=datetime.utcnow())
    test_session.add(u)

    u.update_agent_status_last_visit(discussion)
    role = Role.get_role(R_SYSADMIN, test_session)
    test_session.add(
        UserRole(user=u, role=role))
    test_session.flush()

    def fin():
        print "finalizer discussion_sysadmin_user"
        test_session.delete(u)
        test_session.flush()
    request.addfinalizer(fin)

    return u


@pytest.fixture(scope="function")
def moderator_user(request, test_session, discussion):
    """A User fixture with R_MODERATOR role"""

    from assembl.models import User, UserRole, Role, EmailAccount
    u = User(
        name=u"Jane Doe", type="user", password="password", verified=True,
        last_assembl_login=datetime.utcnow())
    email = EmailAccount(email="janedoe@example.com", profile=u, verified=True)
    test_session.add(u)
    r = Role.get_role(R_MODERATOR, test_session)
    ur = UserRole(user=u, role=r)
    test_session.add(ur)
    u.subscribe(discussion)
    test_session.flush()

    def fin():
        print "finalizer moderator_user"
        test_session.delete(u)
        test_session.flush()

    request.addfinalizer(fin)
    return u


@pytest.fixture(scope="function")
def agent_status_in_discussion_2(request, test_session, discussion, participant2_user):
    """A fixture of agent status in discussion related to participant2_user. The user has not accepted cookies."""
    from assembl.models import AgentStatusInDiscussion
    accepted_cookies = ""
    asid2 = AgentStatusInDiscussion(discussion=discussion, agent_profile=participant2_user, accepted_cookies=accepted_cookies)
    test_session.add(asid2)
    test_session.flush()

    def fin():
        print 'Finalizer agent_status_in_discussion for participant2_user'
        test_session.delete(asid2)
        test_session.flush()
    request.addfinalizer(fin)
    return asid2


@pytest.fixture(scope="function")
def agent_status_in_discussion_3(request, test_session, discussion, participant2_user):
    from assembl.models import AgentStatusInDiscussion
    accepted_cookies = "ACCEPT_CGU"
    asid3 = AgentStatusInDiscussion(discussion=discussion, agent_profile=participant2_user, accepted_cookies=accepted_cookies)
    test_session.add(asid3)
    test_session.flush()

    def fin():
        print 'Finalizer agent_status_in_discussion for participant2_user'
        test_session.delete(asid3)
        test_session.flush()
    request.addfinalizer(fin)
    return asid3


@pytest.fixture(scope="function")
def agent_status_in_discussion_4(request, test_session, discussion, participant2_user):
    from assembl.models import AgentStatusInDiscussion
    accepted_cookies = "ACCEPT_CGU, ACCEPT_SESSION_ON_DISCUSSION"
    asid4 = AgentStatusInDiscussion(discussion=discussion, agent_profile=participant2_user, accepted_cookies=accepted_cookies)
    test_session.add(asid4)
    test_session.flush()

    def fin():
        print 'Finalizer agent_status_in_discussion for participant2_user'
        test_session.delete(asid4)
        test_session.flush()
    request.addfinalizer(fin)
    return asid4
