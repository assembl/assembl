import pytest


def test_empty_user_language_preference_en_cookie(
        langstring_body, fr_from_en_langstring_entry,
        test_adminuser_webrequest, en_locale):
    """
    Body: en, fr-x-mtfrom-en
    User Language Preferences: None
    Request: _LOCALE_: 'en'
    Expect: en
    """

    # A pyramid application uses a locale negotiator that looks for
    # _LOCALE_ in either params or cookies in order to determine the
    # session locale.
    # http://docs.pylonsproject.org/projects/pyramid/en/latest/narr/i18n.html
    test_adminuser_webrequest.cookies["_LOCALE_"] = "en"

    user_language_preference = None
    best = langstring_body.best_lang(
        user_prefs=user_language_preference, allow_errors=True)

    assert best.locale.id == en_locale.id


def test_empty_user_language_preference_fr_cookie(
        langstring_body, fr_from_en_langstring_entry,
        test_adminuser_webrequest, fr_from_en_locale):
    """
    Body: en, fr-x-mtfrom-en
    User Language Preferences: None
    Request: _LOCALE_: 'fr'
    Expect: fr-x-mtfrom-en
    """

    # A pyramid application uses a locale negotiator that looks for
    # _LOCALE_ in either params or cookies in order to determine the
    # session locale.
    # http://docs.pylonsproject.org/projects/pyramid/en/latest/narr/i18n.html
    test_adminuser_webrequest.cookies["_LOCALE_"] = "fr"

    user_language_preference = None
    best = langstring_body.best_lang(
        user_prefs=user_language_preference, allow_errors=True)

    assert best.locale.id == fr_from_en_locale.id


def test_empty_user_language_preference_fr_CA_cookie(
        langstring_body, fr_from_en_langstring_entry,
        test_adminuser_webrequest, fr_from_en_locale):
    """
    Body: en, fr-x-mtfrom-en
    User Language Preferences: None
    Request: _LOCALE_: 'fr_CA'
    Expect: fr-x-mtfrom-en
    """

    # A pyramid application uses a locale negotiator that looks for
    # _LOCALE_ in either params or cookies in order to determine the
    # session locale.
    # http://docs.pylonsproject.org/projects/pyramid/en/latest/narr/i18n.html
    test_adminuser_webrequest.cookies["_LOCALE_"] = "fr_CA"

    user_language_preference = None
    best = langstring_body.best_lang(
        user_prefs=user_language_preference, allow_errors=True)

    assert best.locale.id == fr_from_en_locale.id


def test_user_language_preference_en_cookie(
        user_language_preference_en_cookie, admin_user,
        fr_from_en_langstring_entry, langstring_body,
        test_adminuser_webrequest, en_locale):
    """
    Body: en, fr-x-mtfrom-en
    User Language Preferences: {en: cookie}
    Expect: en
    """
    lang_prefs = admin_user.language_preference
    best = langstring_body.best_lang(user_prefs=lang_prefs, allow_errors=True)

    assert best.locale.id == en_locale.id


def test_user_language_preference_fr_cookie(
        user_language_preference_fr_cookie, admin_user,
        fr_from_en_langstring_entry, langstring_body,
        test_adminuser_webrequest, fr_from_en_locale):
    """
    Body: en, fr-x-mtfrom-en
    User Language Preferences: {fr: cookie}
    Expect: fr-x-mtfrom-en
    """
    lang_prefs = admin_user.language_preference
    best = langstring_body.best_lang(user_prefs=lang_prefs, allow_errors=True)

    assert best.locale.id == fr_from_en_locale.id


def test_user_language_preference_fr_to_en_explicit(
        admin_user, langstring_body, test_adminuser_webrequest,
        user_language_preference_fr_cookie,
        user_language_preference_en_mtfrom_fr,
        user_language_preference_en_explicit,
        fr_from_en_langstring_entry, en_locale):
    # user_language_preference_en_cookie,
    """
    Body: en, fr-x-mtfrom-en
    User Language Preference: {fr-to-en: explicit; en: explicit; en: cookie}
    Expect: en
    """
    lang_prefs = admin_user.language_preference
    best = langstring_body.best_lang(user_prefs=lang_prefs, allow_errors=True)

    assert best.locale.id == en_locale.id


def test_user_language_preference_en_to_fr_explicit(
        admin_user, langstring_body, test_adminuser_webrequest,
        user_language_preference_fr_cookie,
        user_language_preference_fr_mtfrom_en,
        user_language_preference_fr_explicit,
        fr_from_en_langstring_entry, fr_from_en_locale):
    """
    Body: en, fr-x-mtfrom-en
    User Language Preference: {en-to-fr: explicit; fr: explicit; en: cookie}
    Expect: fr-x-mtfrom-en
    """
    lang_prefs = admin_user.language_preference
    best = langstring_body.best_lang(user_prefs=lang_prefs, allow_errors=True)

    assert best.locale.id == fr_from_en_locale.id


def test_user_language_preference_fr_to_en_explicit_missing_en_explicit(
        admin_user, langstring_body, test_adminuser_webrequest,
        user_language_preference_fr_cookie,
        user_language_preference_en_mtfrom_fr,
        fr_from_en_langstring_entry, en_locale):
    """
    Body: en, fr-x-mtfrom-en
    User Language Preference: {en-to-fr: explicit; fr: explicit; en: cookie}
    Expect: fr-x-mtfrom-en
    """
    lang_prefs = admin_user.language_preference
    best = langstring_body.best_lang(user_prefs=lang_prefs, allow_errors=True)

    assert best.locale.id == en_locale.id


def test_user_language_preference_en_to_fr_explicit_missing_fr_explicit(
        admin_user, langstring_body, test_adminuser_webrequest,
        user_language_preference_fr_cookie,
        user_language_preference_fr_mtfrom_en,
        fr_from_en_langstring_entry, fr_from_en_locale):
    """
    Body: en, fr-x-mtfrom-en
    User Language Preference: {en-to-fr: explicit; fr: explicit; en: cookie}
    Expect: fr-x-mtfrom-en
    """
    lang_prefs = admin_user.language_preference
    best = langstring_body.best_lang(user_prefs=lang_prefs, allow_errors=True)

    assert best.locale.id == fr_from_en_locale.id


def test_user_language_preference_en_to_fr_explicit_and_fr_explicit(
        admin_user, langstring_body, test_adminuser_webrequest,
        user_language_preference_en_cookie,
        user_language_preference_fr_mtfrom_en,
        test_session, fr_locale):
    """
    User Language Preference: {en: cookie; en-to-fr: Explicit}
    Add {fr: Explicit} to User Language Preference
    Expect: IntegrityError
    """
    from pyodbc import IntegrityError
    from assembl.models.auth import (
        LanguagePreferenceOrder,
        UserLanguagePreference
    )

    ulp = UserLanguagePreference(
        user=admin_user,
        locale=fr_locale,
        preferred_order=0,
        source_of_evidence=LanguagePreferenceOrder.Explicit)

    test_session.add(ulp)
    test_session.flush()

    pytest.raises(IntegrityError)


def test_user_language_preference_en_to_fr_explicit_fr_to_it_explicit(
        admin_user, langstring_body, test_adminuser_webrequest,
        user_language_preference_en_cookie,
        user_language_preference_fr_mtfrom_en,
        user_language_preference_it_mtfrom_fr,
        en_langstring_entry,
        fr_from_en_langstring_entry,
        it_from_en_langstring_entry,
        it_from_en_locale):
    """
    Body: en, fr-x-mtfrom-en, it-x-mtfrom-en
    User Language Preference: {en: cookie; en-to-fr: explicit;
                               fr-to-it: explicit}
    Expect: it-x-mtfrom-en
    """

    lang_prefs = admin_user.language_preference
    best = langstring_body.best_lang(user_prefs=lang_prefs, allow_errors=True)

    assert best.locale.id == it_from_en_locale.id


def test_user_language_preference_fr_explicit_en_cookie_en_entry(
        admin_user, langstring_body, test_adminuser_webrequest,
        user_language_preference_en_cookie,
        user_language_preference_fr_explicit,
        en_langstring_entry, it_from_en_langstring_entry,
        fr_from_en_langstring_entry, fr_from_en_locale):
    """
    Body: en, it-x-mtfrom-en, fr-x-mtfrom-en
    User Language Peference: {fr: explicit; en: cookie}
    Comment: {en: cookie} is a fallback
    Expect: fr-x-mtfrom-en
    """
    lang_prefs = admin_user.language_preference
    best = langstring_body.best_lang(user_prefs=lang_prefs, allow_errors=True)

    assert best.locale.id == fr_from_en_locale.id


def test_user_language_preference_fr_explicit_en_cookie_fr_entry(
        admin_user, langstring_body, test_adminuser_webrequest,
        user_language_preference_en_cookie,
        user_language_preference_fr_explicit,
        en_langstring_entry, fr_from_en_langstring_entry,
        it_from_en_langstring_entry,
        fr_from_en_locale):
    """
    Body: en, fr-x-mtfrom-en, it-x-mtfrom-en
    User Language Peference: {fr: explicit; en: cookie}
    Comment: {en: cookie} is a fallback
    Expect: fr-x-mtfrom-en
    """
    lang_prefs = admin_user.language_preference
    best = langstring_body.best_lang(user_prefs=lang_prefs, allow_errors=True)

    assert best.locale.id == fr_from_en_locale.id


def test_user_language_preference_en_to_fr_explicit_en_cookie_fr_entry(
        admin_user, langstring_body, test_adminuser_webrequest,
        user_language_preference_en_cookie,
        user_language_preference_fr_mtfrom_en,
        en_langstring_entry, fr_from_en_langstring_entry,
        fr_from_en_locale):
    """
    Body: en, fr-x-mtfrom-en
    User Language Preference: {en: cookie; en-to-fr: explicit}
    Expect: fr-x-mtfrom-en
    """
    lang_prefs = admin_user.language_preference
    best = langstring_body.best_lang(user_prefs=lang_prefs, allow_errors=True)

    assert best.locale.id == fr_from_en_locale.id


def test_user_language_preferences_it_explicit_en_cookie_fr_entry(
        admin_user, langstring_body, test_adminuser_webrequest,
        user_language_preference_en_cookie,
        user_language_preference_it_explicit,
        fr_langstring_entry, it_from_fr_langstring_entry,
        en_from_fr_langstring_entry,
        it_from_fr_locale):
    """
    Body: fr, it-x-mtfrom-fr, en-x-mtfrom-fr
    User Language Preferences: {en: cookie; fr: explicit}
    Expect: it-x-mtfrom-fr
    """
    lang_prefs = admin_user.language_preference
    best = langstring_body.best_lang(user_prefs=lang_prefs, allow_errors=True)

    assert best.locale.id == it_from_fr_locale.id


def test_user_language_preferences_fr_to_it_explicit_en_cookie_fr_entry(
        admin_user, langstring_body, test_adminuser_webrequest,
        user_language_preference_en_cookie,
        user_language_preference_it_mtfrom_en,
        fr_langstring_entry, it_from_fr_langstring_entry,
        en_from_fr_langstring_entry,
        it_from_fr_locale):
    """
    Body: fr, it-x-mtfrom-fr, en-x-mtfrom-fr
    User Language Preferences: {en: cookie; en-to-it: explicit}
    Expect: it-x-mtfrom-fr
    """
    lang_prefs = admin_user.language_preference
    best = langstring_body.best_lang(user_prefs=lang_prefs, allow_errors=True)

    assert best.locale.id == it_from_fr_locale.id
