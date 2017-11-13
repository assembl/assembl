import pytest

from assembl.auth import R_MODERATOR, R_PARTICIPANT


@pytest.fixture(scope="function")
def participant1_user(request, test_session, discussion):
    """A User fixture with R_PARTICIPANT role"""

    from assembl.models import User, UserRole, Role, EmailAccount
    u = User(name=u"A. Barking Loon", type="user", password="password",
             verified=True)
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
def participant2_user(request, test_session):
    """A User fixture with R_PARTICIPANT role"""

    from assembl.models import User, UserRole, Role
    u = User(name=u"James T. Expert", type="user")
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

    u = User(name=u"Maximilien de Robespierre", type="user")
    test_session.add(u)

    asid = u.create_agent_status_in_discussion(discussion)
    asid.last_visit = datetime.utcnow()
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
def moderator_user(request, test_session, discussion):

    """A User fixture with R_MODERATOR role"""

    from assembl.models import User, UserRole, Role, EmailAccount
    u = User(
        name=u"Jane Doe", type="user", password="password", verified=True)
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
