from assembl.models.langstrings import Locale


def test_cookie_ulp(user_language_preference_cookie):
    u = user_language_preference_cookie
    locale = Locale.get(u.locale_id)

    print "---------------------------------"
    print locale
    assert 0

# pick interface default

# Empty user language preferences -> interface default language is best
# Cookie user language preference -> use the cookie language
# from_to + to user language preference -> the to language
# to is missing -> use the to language in the from-to combination
# a -> b, b -> c -> merge, should expect c
# exception to translate a language from A -> A (en -> en/ en -> en_CA)
# 
