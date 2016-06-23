import pytest

from assembl.auth import R_PARTICIPANT


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
