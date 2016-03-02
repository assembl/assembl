from assembl.models.langstrings import Locale


def test_cookie_ulp(user_language_preference_cookie):
    u = user_language_preference_cookie
    locale = Locale.get(u.locale_id)
    print locale
    assert 0
