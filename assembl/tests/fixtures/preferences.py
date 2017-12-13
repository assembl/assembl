import pytest


@pytest.fixture(scope="function")
def default_preferences(request, test_session, base_registry):
    """A Preference fixture with default settings"""
    from assembl.models import Preferences
    from assembl.auth.social_auth import adjust_settings
    settings = base_registry.settings
    adjust_settings(settings)
    Preferences.init_from_settings(settings)
    prefs = Preferences.get_default_preferences()
    test_session.add(prefs)
    test_session.flush()

    def fin():
        print "finalizer default_preferences"
        test_session.delete(prefs)
        test_session.flush()
    request.addfinalizer(fin)
    return prefs
