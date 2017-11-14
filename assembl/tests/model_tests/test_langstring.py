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


@pytest.mark.xfail
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


@pytest.mark.xfail
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
    from sqlalchemy.exc import IntegrityError
    from assembl.models.auth import (
        LanguagePreferenceOrder,
        UserLanguagePreference
    )

    ulp = UserLanguagePreference(
        user=admin_user,
        locale=fr_locale,
        preferred_order=0,
        source_of_evidence=LanguagePreferenceOrder.Explicit.value)

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
        it_from_en_locale,
        fr_from_en_locale):
    """
    Body: en, fr-x-mtfrom-en, it-x-mtfrom-en
    User Language Preference: {en: cookie; en-to-fr: explicit;
                               fr-to-it: explicit}
    Expect: fr-x-mtfrom-en
    """

    lang_prefs = admin_user.language_preference
    best = langstring_body.best_lang(user_prefs=lang_prefs, allow_errors=True)

    assert best.locale.id == fr_from_en_locale.id


def test_user_language_preference_fr_explicit_en_cookie_en_entry(
        admin_user, langstring_body, test_adminuser_webrequest,
        user_language_preference_en_cookie,
        user_language_preference_fr_explicit,
        en_langstring_entry, it_from_en_langstring_entry,
        fr_from_en_langstring_entry, en_locale):
    """
    Body: en, it-x-mtfrom-en, fr-x-mtfrom-en
    User Language Peference: {fr: explicit; en: cookie}
    Comment: {en: cookie} is a fallback
    Expect: en
    """
    lang_prefs = admin_user.language_preference
    best = langstring_body.best_lang(user_prefs=lang_prefs, allow_errors=True)

    assert best.locale.id == en_locale.id


def test_user_language_preference_fr_explicit_en_cookie_fr_entry(
        admin_user, langstring_body, test_adminuser_webrequest,
        user_language_preference_en_cookie,
        user_language_preference_fr_explicit,
        fr_langstring_entry, en_from_fr_langstring_entry,
        it_from_fr_langstring_entry,
        en_from_fr_locale, fr_locale):
    """
    Body: fr, en-x-mtfrom-fr, it-x-mtfrom-fr
    User Language Peference: {fr: explicit; en: cookie}
    Comment: {en: cookie} is a fallback
    Expect: fr
    """
    lang_prefs = admin_user.language_preference
    best = langstring_body.best_lang(user_prefs=lang_prefs, allow_errors=True)

    assert best.locale.id == fr_locale.id


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
    User Language Preferences: {en: cookie; it: explicit}
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


def test_user_language_preference_fr_cookie_en_entry(
        admin_user, langstring_body, test_adminuser_webrequest,
        user_language_preference_fr_cookie,
        fr_from_en_langstring_entry,
        fr_from_en_locale):
    """
    Body: en
    User Language Preference: {fr: cookie}
    Expect: en
    """

    lang_prefs = admin_user.language_preference
    best = langstring_body.best_lang(user_prefs=lang_prefs, allow_errors=True)

    assert best.locale.id == fr_from_en_locale.id


def test_user_language_preference_fr_cookie_fr_entry(
        admin_user, langstring_body, test_adminuser_webrequest,
        user_language_preference_fr_cookie,
        fr_langstring_entry,
        fr_locale):
    """
    Body: fr
    User Language Preference: {fr: cookie}
    Expect: fr
    """
    lang_prefs = admin_user.language_preference
    best = langstring_body.best_lang(user_prefs=lang_prefs, allow_errors=True)

    assert best.locale.id == fr_locale.id


def test_user_language_preference_fr_from_en_it_from_fr_en_entry(
        admin_user, langstring_body, test_adminuser_webrequest,
        user_language_preference_fr_mtfrom_en,
        user_language_preference_it_mtfrom_fr,
        fr_from_en_langstring_entry,
        langstring_entry_values,
        it_from_fr_locale,
        test_session, fr_from_en_locale):
    """
    Body: en, fr-x-mtfrom-en, it-x-mtfrom-fr
    User Language Preference: {en-to-fr: explicit, fr-to-it}
    Expect: fr-x-mtfrom-en
    """
    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=it_from_fr_locale,
        value=langstring_entry_values.get('body').get('it')
    )

    test_session.expire(langstring_body, ["entries"])

    test_session.add(entry)
    test_session.commit()

    lang_prefs = admin_user.language_preference
    best = langstring_body.best_lang(user_prefs=lang_prefs, allow_errors=True)

    assert best.locale.id == fr_from_en_locale.id


def test_user_language_preference_fr_from_en_it_from_fr_fr_entry(
        admin_user, langstring_body, test_adminuser_webrequest,
        user_language_preference_fr_mtfrom_en,
        user_language_preference_it_mtfrom_fr,
        it_from_fr_langstring_entry,
        langstring_entry_values,
        en_from_fr_locale,
        test_session, it_from_fr_locale):
    """
    Body: fr, it-x-mtfrom-fr, en-x-mtfrom-fr
    User Language Preference: {en-to-fr: explicit, fr-to-it}
    Expect: fr-x-mtfrom-en
    """
    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=en_from_fr_locale,
        value=langstring_entry_values.get('body').get('en')
    )

    test_session.expire(langstring_body, ["entries"])

    test_session.add(entry)
    test_session.commit()

    lang_prefs = admin_user.language_preference
    best = langstring_body.best_lang(user_prefs=lang_prefs, allow_errors=True)

    assert best.locale.id == it_from_fr_locale.id


def test_user_language_preference_fr_from_en_it_from_fr_it_entry(
        admin_user, langstring_body, test_adminuser_webrequest,
        user_language_preference_fr_mtfrom_en,
        user_language_preference_it_mtfrom_fr,
        en_from_it_langstring_entry,
        langstring_entry_values,
        fr_from_it_locale,
        test_session, it_locale):
    """
    Body: fr, it-x-mtfrom-fr, en-x-mtfrom-fr
    User Language Preference: {en-to-fr: explicit, fr-to-it}
    Expect: fr-x-mtfrom-en
    """
    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=fr_from_it_locale,
        value=langstring_entry_values.get('body').get('fr')
    )

    test_session.expire(langstring_body, ["entries"])

    test_session.add(entry)
    test_session.commit()

    lang_prefs = admin_user.language_preference
    best = langstring_body.best_lang(user_prefs=lang_prefs, allow_errors=True)

    assert best.locale.id == it_locale.id


def test_user_language_preference_it_explicit_fr_explicit_en_entry(
        admin_user, langstring_body, test_adminuser_webrequest,
        user_language_preference_it_explicit,
        user_language_preference_fr_explicit,
        fr_from_en_langstring_entry,
        it_from_en_langstring_entry,
        test_session, fr_locale,
        it_from_en_locale):
    """
    Body: en, fr-x-mtfrom-en, it-x-mtfrom-en
    User Language Preference: {it: explicit, priority: 0;
                               fr: explicit, priority: 1}
    Expect: it-x-mtfrom-en
    """
    lang_prefs = admin_user.language_preference

    fr_pref = [a for a in lang_prefs
               if a.user == admin_user and
               a.locale == fr_locale][0]

    fr_pref.preferred_order = 1
    test_session.flush()

    best = langstring_body.best_lang(user_prefs=lang_prefs, allow_errors=True)

    assert best.locale.id == it_from_en_locale.id


def test_user_language_preference_it_from_fr_en_from_de_tr_entry(
        admin_user, langstring_body, test_adminuser_webrequest,
        user_language_preference_it_mtfrom_fr,
        user_language_preference_en_mtfrom_de,
        en_from_tr_langstring_entry,
        de_from_tr_langstring_entry,
        it_from_fr_locale,
        fr_locale, it_locale,
        test_session, en_from_tr_locale):
    """
    Body: tr, en-x-mtfrom-tr, de-x-mtfrom-tr
    User Language Preference: {fr-to-it: explicit, priority: 1,
                               de-to-en: explicit, priority: 0}
    Expect: en-x-mtfrom-tr
    """

    lang_prefs = admin_user.language_preference

    it_from_fr_pref = [a for a in lang_prefs
                       if a.user == admin_user and
                       a.locale == fr_locale and
                       a.translate_to_locale == it_locale][0]

    it_from_fr_pref.preferred_order = 1

    test_session.flush()

    best = langstring_body.best_lang(user_prefs=lang_prefs, allow_errors=True)

    assert best.locale.id == en_from_tr_locale.id


def test_user_language_preference_locale_non_linguistic(
        admin_user, langstring_body, test_adminuser_webrequest,
        user_language_preference_en_cookie,
        user_language_preference_fr_mtfrom_en,
        non_linguistic_langstring_entry,
        non_linguistic_locale):
    """
    Body: non-linguistic,
    User Language Preference: {en: cookie; en-to-fr: explicit}
    Expect: non-linguistic
    """

    lang_prefs = admin_user.language_preference
    best = langstring_body.best_lang(user_prefs=lang_prefs, allow_errors=True)

    assert best.locale.id == non_linguistic_locale.id


# Is this true?? @TODO: Check with MAP
def test_user_language_preference_locale_undefined_fr_from_und(
        admin_user, langstring_body, test_adminuser_webrequest,
        user_language_preference_en_cookie,
        user_language_preference_fr_mtfrom_en,
        fr_from_und_langstring_entry,
        fr_from_und_locale):
    """
    Body: und, fr-x-mtfrom-und
    User Language Preference: {en: cookie; en-to-fr: explicit}
    Expect: fr-x-mtfrom-und
    """

    lang_prefs = admin_user.language_preference
    best = langstring_body.best_lang(user_prefs=lang_prefs, allow_errors=True)

    assert best.locale.id == fr_from_und_locale.id


def test_user_language_preference_en_from_fr_fr_from_en_en_entry(
        admin_user, langstring_body, test_adminuser_webrequest,
        user_language_preference_fr_mtfrom_en,
        user_language_preference_en_mtfrom_fr,
        fr_from_en_langstring_entry,
        fr_from_en_locale):
    """
    Body: en, fr-x-mtfrom-en
    User Language Preference: {en-to-fr: explicit; fr-to-en: explicit}
    Expect: fr-x-mtfrom-en
    """

    lang_prefs = admin_user.language_preference
    best = langstring_body.best_lang(user_prefs=lang_prefs, allow_errors=True)

    assert best.locale.id == fr_from_en_locale.id


def test_user_language_preference_en_from_fr_fr_from_en_fr_entry(
        admin_user, langstring_body, test_adminuser_webrequest,
        user_language_preference_fr_mtfrom_en,
        user_language_preference_en_mtfrom_fr,
        en_from_fr_langstring_entry,
        en_from_fr_locale):
    """
    Body: fr, en-x-mtfrom-fr
    User Language Preference: {en-to-fr: explicit; fr-to-en: explicit}
    Expect: en-x-mtfrom-fr
    """

    lang_prefs = admin_user.language_preference
    best = langstring_body.best_lang(user_prefs=lang_prefs, allow_errors=True)

    assert best.locale.id == en_from_fr_locale.id


def test_identify_long_strings(langstring_entry_values, discussion):
    """These are longer than the threshold, so should be correctly identified
    even if not in the discussion_locales."""
    ts = discussion.translation_service()
    for loc, val in langstring_entry_values['body'].items():
        res, _ = ts.identify(val, constrain_locale_threshold=60)
        assert loc == res, \
            "Incorrect identification for %s: %s instead of %s" % (
                val, res, loc)


def test_identify_short_strings(langstring_entry_values, discussion):
    """These are shorter than the threshold, so identification
    should be cnostrained by discussion_locales."""
    ts = discussion.translation_service()
    for loc, val in langstring_entry_values['body'].items():
        res, _ = ts.identify(val)
        if loc in discussion.discussion_locales:
            assert loc == res, \
                "Incorrect identification for %s: %s instead of %s" % (
                    val, res, loc)
        else:
            assert res in discussion.discussion_locales


def test_identify_ambiguous_langstring(
        ambiguous_langstring, discussion, en_locale):
    """This test is not useful, but is necessary to contrast
    with the following tests"""
    ts = discussion.translation_service()
    entry = ambiguous_langstring.first_original()
    ts.confirm_locale(entry)
    assert entry.locale_code == 'en'


def test_identify_ambiguous_string_in_post(fully_ambiguous_post):
    """This test is not useful, but is necessary to contrast
    with the following tests"""
    fully_ambiguous_post.guess_languages()
    assert fully_ambiguous_post.body.first_original().locale_code == 'en'
    assert fully_ambiguous_post.subject.first_original().locale_code == 'en'


def test_identify_ambiguous_subject_in_post_by_body(
        post_subject_locale_determined_by_body):
    post_subject_locale_determined_by_body.guess_languages()
    assert post_subject_locale_determined_by_body.body.\
        first_original().locale_code == 'fr'
    assert post_subject_locale_determined_by_body.subject.\
        first_original().locale_code == 'fr'


def test_identify_ambiguous_body_in_post_by_creator(
        post_body_locale_determined_by_creator):
    post_body_locale_determined_by_creator.guess_languages()
    assert post_body_locale_determined_by_creator.body.\
        first_original().locale_code == 'fr'
    assert post_body_locale_determined_by_creator.subject.\
        first_original().locale_code == 'fr'


def test_identify_ambiguous_body_in_post_by_import(
        post_body_locale_determined_by_import):
    post_body_locale_determined_by_import.guess_languages()
    assert post_body_locale_determined_by_import.body.\
        first_original().locale_code == 'fr'
    assert post_body_locale_determined_by_import.subject.\
        first_original().locale_code == 'fr'

def test_clone_langstring_has_same_content_as_original(
        en_langstring, test_session):
    from datetime import datetime

    tombstone = datetime.utcnow()
    boba_fett = en_langstring.clone(tombstone=tombstone)
    test_session.flush() # so that boba_fett receives ids

    en_langstring_entry_original = en_langstring.first_original()
    boba_fett_entry_original = boba_fett.first_original()

    assert en_langstring
    assert en_langstring.id
    assert boba_fett
    assert boba_fett.id
    assert boba_fett.id != en_langstring.id
    assert en_langstring_entry_original
    assert en_langstring_entry_original.id
    assert boba_fett_entry_original
    assert boba_fett_entry_original.id
    assert boba_fett_entry_original.id != en_langstring_entry_original.id
    assert boba_fett_entry_original.locale.id == en_langstring_entry_original.locale.id
    assert boba_fett_entry_original.value == en_langstring_entry_original.value

    for entry in boba_fett.entries:
        test_session.delete(entry)
    test_session.delete(boba_fett)
    test_session.commit()

