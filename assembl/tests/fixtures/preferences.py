import pytest


@pytest.fixture(scope="function")
def default_preferences(request, test_session):
    from assembl.models import Preferences
    prefs = Preferences.get_default_preferences()
    test_session.add(prefs)
    test_session.flush()

    def fin():
        print "finalizer default_preferences"
        test_session.delete(prefs)
        test_session.flush()
    request.addfinalizer(fin)
    return prefs
