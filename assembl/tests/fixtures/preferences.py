import pytest

from assembl.auth import P_SYSADMIN


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


@pytest.fixture(scope="function")
def non_standard_preference(request, test_session):
    from assembl.models import Preferences

    class SubPreference(Preferences):
        preference_data_list = [
            {
                "id": "preference_data",
                "name": "Preference data",
                "value_type": "json",
                "show_in_preferences": False,
                "description": "The preference configuration; override only with care",
                "allow_user_override": None,
                "modification_permission": P_SYSADMIN,
                "default": {}
            },
            {
                "id": "test_url",
                "value_type": "url",
                "name": "A URI",
                "description": "A URI, must have a scheme. Can be followed by a domain or an IP address",
                "allow_user_override": None,
                "default": ""
            },
        ]
        preference_data_key_list = [p["id"] for p in preference_data_list]
        preference_data_key_set = set(preference_data_key_list)
        preference_data = {p["id"]: p for p in preference_data_list}

    pref = SubPreference(name="my_pref")
    test_session.add(pref)
    test_session.flush()

    def fin():
        print "finalizer empty_preference"
        test_session.delete(pref)
        test_session.flush()
    request.addfinalizer(fin)
    return pref
