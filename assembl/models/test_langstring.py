

def test_empty_user_language_preference(langstring_body,
                                        fr_from_en_langstring_entry,
                                        test_app,
                                        test_webrequest):
    """
    Testing best_lang
    Body: en, fr-x-mtfrom-en
    User Language Preferences: None
    Expect: Whatever type is in the request; if none, original.
    """
    body = fr_from_en_langstring_entry
    user_language_preference = None

    lang = langstring_body.best_lang(
        user_prefs=user_language_preference,
        allow_errors=True)
    import pdb; pdb.set_trace()
    auth = test_webrequest.authorization


def test_cookie_ulp(user_language_preference_en_cookie,
                    participant1_user,
                    en_langstring_entry,
                    fr_from_en_langstring_entry,
                    langstring_body):

    lang_prefs = participant1_user.language_preference
    best = langstring_body.best_lang(lang_prefs)
    import pdb; pdb.set_trace()
    print "Best language being picked here. %s" % best


# pick interface default

# Empty user language preferences -> interface default language is best
# Cookie user language preference -> use the cookie language
# from_to + to user language preference -> the to language
# to is missing -> use the to language in the from-to combination
# a -> b, b -> c -> merge, should expect c
# exception to translate a language from A -> A (en -> en/ en -> en_CA)
# 
