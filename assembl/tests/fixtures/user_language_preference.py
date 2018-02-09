import pytest

@pytest.fixture(scope="function")
def participant1_user_language_preference_en_cookie(request, test_session, en_locale,
                                                    participant1_user):
    """Participant 1 User Language Preference fixture with English (en) cookie level"""

    from assembl.models.auth import (
        UserLanguagePreference,
        LanguagePreferenceOrder
    )

    locale_from = en_locale
    ulp = UserLanguagePreference(
        user=participant1_user,
        locale=locale_from,
        preferred_order=0,
        source_of_evidence=LanguagePreferenceOrder.Cookie.value)

    def fin():
        print "finalizer participant1_user_language_preference_en_cookie"
        test_session.delete(ulp)
        test_session.flush()

    test_session.add(ulp)
    test_session.flush()
    request.addfinalizer(fin)
    return ulp


@pytest.fixture(scope="function")
def participant1_user_language_preference_fr_cookie(request, test_session, fr_locale,
                                                    participant1_user):
    """Participant 1 User Language Preference fixture with French (fr) cookie level"""

    from assembl.models.auth import (
        UserLanguagePreference,
        LanguagePreferenceOrder
    )

    locale_from = fr_locale
    ulp = UserLanguagePreference(
        user=participant1_user,
        locale=locale_from,
        preferred_order=0,
        source_of_evidence=LanguagePreferenceOrder.Cookie.value)

    def fin():
        print "finalizer participant1_user_language_preference_fr_cookie"
        test_session.delete(ulp)
        test_session.flush()

    test_session.add(ulp)
    test_session.flush()
    request.addfinalizer(fin)
    return ulp


@pytest.fixture(scope="function")
def user_language_preference_en_cookie(request, test_session, en_locale,
                                       admin_user):
    """User Language Preference fixture with English (en) cookie level"""

    from assembl.models.auth import (
        UserLanguagePreference,
        LanguagePreferenceOrder
    )

    locale_from = en_locale
    ulp = UserLanguagePreference(
        user=admin_user,
        locale=locale_from,
        preferred_order=0,
        source_of_evidence=LanguagePreferenceOrder.Cookie.value)

    def fin():
        print "finalizer user_language_preference_en_cookie"
        test_session.delete(ulp)
        test_session.flush()

    test_session.add(ulp)
    test_session.flush()
    request.addfinalizer(fin)
    return ulp


@pytest.fixture(scope="function")
def user_language_preference_fr_cookie(request, test_session, fr_locale,
                                       admin_user):
    """User Language Preference fixture with French (fr) cookie level"""

    from assembl.models.auth import (
        UserLanguagePreference,
        LanguagePreferenceOrder
    )

    locale_from = fr_locale
    ulp = UserLanguagePreference(
        user=admin_user,
        locale=locale_from,
        preferred_order=0,
        source_of_evidence=LanguagePreferenceOrder.Cookie.value)

    def fin():
        print "finalizer user_language_preference_fr_cookie"
        test_session.delete(ulp)
        test_session.flush()

    test_session.add(ulp)
    test_session.flush()
    request.addfinalizer(fin)
    return ulp


@pytest.fixture(scope="function")
def user_language_preference_it_cookie(request, test_session, it_locale,
                                       admin_user):
    """User Language Preference fixture with Italian (it) cookie level"""

    from assembl.models.auth import (
        UserLanguagePreference,
        LanguagePreferenceOrder
    )

    locale_from = it_locale
    ulp = UserLanguagePreference(
        user=admin_user,
        locale=locale_from,
        preferred_order=0,
        source_of_evidence=LanguagePreferenceOrder.Cookie.value)

    def fin():
        print "finalizer user_language_preference_it_cookie"
        test_session.delete(ulp)
        test_session.flush()

    test_session.add(ulp)
    test_session.flush()
    request.addfinalizer(fin)
    return ulp


@pytest.fixture(scope="function")
def user_language_preference_en_explicit(request, test_session, en_locale,
                                         admin_user):
    """User Language Preference fixture with English (en) explicit level"""

    from assembl.models.auth import (
        UserLanguagePreference,
        LanguagePreferenceOrder
    )

    locale_from = en_locale
    ulp = UserLanguagePreference(
        user=admin_user,
        locale=locale_from,
        preferred_order=0,
        source_of_evidence=LanguagePreferenceOrder.Explicit.value)

    def fin():
        print "finalizer user_language_preference_en_explicit"
        test_session.delete(ulp)
        test_session.flush()

    test_session.add(ulp)
    test_session.flush()
    request.addfinalizer(fin)
    return ulp


@pytest.fixture(scope="function")
def user_language_preference_fr_explicit(request, test_session, fr_locale,
                                         admin_user):
    """User Language Preference fixture with French (fr) explicit level"""

    from assembl.models.auth import (
        UserLanguagePreference,
        LanguagePreferenceOrder
    )

    locale_from = fr_locale
    ulp = UserLanguagePreference(
        user=admin_user,
        locale=locale_from,
        preferred_order=0,
        source_of_evidence=LanguagePreferenceOrder.Explicit.value)

    def fin():
        print "finalizer user_language_preference_cookie"
        test_session.delete(ulp)
        test_session.flush()

    test_session.add(ulp)
    test_session.flush()
    request.addfinalizer(fin)
    return ulp


@pytest.fixture(scope="function")
def user_language_preference_it_explicit(request, test_session, it_locale,
                                         admin_user):
    """User Language Preference fixture with Italian (it) explicit level"""

    from assembl.models.auth import (
        UserLanguagePreference,
        LanguagePreferenceOrder
    )

    locale_from = it_locale
    ulp = UserLanguagePreference(
        user=admin_user,
        locale=locale_from,
        preferred_order=0,
        source_of_evidence=LanguagePreferenceOrder.Explicit.value)

    def fin():
        print "finalizer user_language_preference_it_explicit"
        test_session.delete(ulp)
        test_session.flush()

    test_session.add(ulp)
    test_session.flush()
    request.addfinalizer(fin)
    return ulp


@pytest.fixture(scope="function")
def user_language_preference_de_explicit(request, test_session, de_locale,
                                         admin_user):
    """User Language Preference fixture with German (de) explicit level"""

    from assembl.models.auth import (
        UserLanguagePreference,
        LanguagePreferenceOrder
    )

    locale_from = de_locale
    ulp = UserLanguagePreference(
        user=admin_user,
        locale=locale_from,
        preferred_order=0,
        source_of_evidence=LanguagePreferenceOrder.Explicit.value)

    def fin():
        print "finalizer user_language_preference_de_explicit"
        test_session.delete(ulp)
        test_session.flush()

    test_session.add(ulp)
    test_session.flush()
    request.addfinalizer(fin)
    return ulp


@pytest.fixture(scope="function")
def user_language_preference_tr_explicit(request, test_session, tr_locale,
                                         admin_user):
    """User Language Preference fixture with Turkish (tr) explicit level"""

    from assembl.models.auth import (
        UserLanguagePreference,
        LanguagePreferenceOrder
    )

    locale_from = tr_locale
    ulp = UserLanguagePreference(
        user=admin_user,
        locale=locale_from,
        preferred_order=0,
        source_of_evidence=LanguagePreferenceOrder.Explicit.value)

    def fin():
        print "finalizer user_language_preference_tr_explicit"
        test_session.delete(ulp)
        test_session.flush()

    test_session.add(ulp)
    test_session.flush()
    request.addfinalizer(fin)
    return ulp


@pytest.fixture(scope="function")
def user_language_preference_fr_mtfrom_en(request, test_session,
                                          en_locale, fr_locale,
                                          admin_user):
    """User Language Preference fixture with French (fr) translated
    from English (en) explicit level"""

    from assembl.models.auth import (
        UserLanguagePreference,
        LanguagePreferenceOrder
    )

    ulp = UserLanguagePreference(
        user=admin_user,
        locale=en_locale,
        translate_to_locale=fr_locale,
        preferred_order=0,
        source_of_evidence=LanguagePreferenceOrder.Explicit.value)

    def fin():
        test_session.delete(ulp)
        test_session.flush()

    test_session.add(ulp)
    test_session.flush()
    request.addfinalizer(fin)
    return ulp


@pytest.fixture(scope="function")
def user_language_preference_en_mtfrom_fr(request, test_session,
                                          en_locale, fr_locale,
                                          admin_user):
    """User Language Preference fixture with English (en) translated
    from French (fr) explicit level"""

    from assembl.models.auth import (
        UserLanguagePreference,
        LanguagePreferenceOrder
    )

    ulp = UserLanguagePreference(
        user=admin_user,
        locale=fr_locale,
        translate_to_locale=en_locale,
        preferred_order=0,
        source_of_evidence=LanguagePreferenceOrder.Explicit.value)

    def fin():
        test_session.delete(ulp)
        test_session.flush()

    test_session.add(ulp)
    test_session.flush()
    request.addfinalizer(fin)
    return ulp


@pytest.fixture(scope="function")
def user_language_preference_it_mtfrom_en(request, test_session,
                                          en_locale, it_locale,
                                          admin_user):
    """User Language Preference fixture with Italian (it) translated
    from English (en) explicit level"""

    from assembl.models.auth import (
        UserLanguagePreference,
        LanguagePreferenceOrder
    )

    ulp = UserLanguagePreference(
        user=admin_user,
        locale=en_locale,
        translate_to_locale=it_locale,
        preferred_order=0,
        source_of_evidence=LanguagePreferenceOrder.Explicit.value)

    def fin():
        test_session.delete(ulp)
        test_session.flush()

    test_session.add(ulp)
    test_session.flush()
    request.addfinalizer(fin)
    return ulp


@pytest.fixture(scope="function")
def user_language_preference_en_mtfrom_it(request, test_session,
                                          en_locale, it_locale,
                                          admin_user):
    """User Language Preference fixture with English (en) translated
    from Italian (it) explicit level"""

    from assembl.models.auth import (
        UserLanguagePreference,
        LanguagePreferenceOrder
    )

    ulp = UserLanguagePreference(
        user=admin_user,
        locale=it_locale,
        translate_to_locale=en_locale,
        preferred_order=0,
        source_of_evidence=LanguagePreferenceOrder.Explicit.value)

    def fin():
        test_session.delete(ulp)
        test_session.flush()

    test_session.add(ulp)
    test_session.flush()
    request.addfinalizer(fin)
    return ulp


@pytest.fixture(scope="function")
def user_language_preference_it_mtfrom_fr(request, test_session,
                                          fr_locale, it_locale,
                                          admin_user):
    """User Language Preference fixture with Italian (it) translated
    from French (fr) explicit level"""

    from assembl.models.auth import (
        UserLanguagePreference,
        LanguagePreferenceOrder
    )

    ulp = UserLanguagePreference(
        user=admin_user,
        locale=fr_locale,
        translate_to_locale=it_locale,
        preferred_order=0,
        source_of_evidence=LanguagePreferenceOrder.Explicit.value)

    def fin():
        test_session.delete(ulp)
        test_session.flush()

    test_session.add(ulp)
    test_session.flush()
    request.addfinalizer(fin)
    return ulp


@pytest.fixture(scope="function")
def user_language_preference_fr_mtfrom_it(request, test_session,
                                          fr_locale, it_locale,
                                          admin_user):
    """User Language Preference fixture with French (fr) translated
    from Italian (it) explicit level"""

    from assembl.models.auth import (
        UserLanguagePreference,
        LanguagePreferenceOrder
    )

    ulp = UserLanguagePreference(
        user=admin_user,
        locale=it_locale,
        translate_to_locale=fr_locale,
        preferred_order=0,
        source_of_evidence=LanguagePreferenceOrder.Explicit.value)

    def fin():
        test_session.delete(ulp)
        test_session.flush()

    test_session.add(ulp)
    test_session.flush()
    request.addfinalizer(fin)
    return ulp


@pytest.fixture(scope="function")
def user_language_preference_de_mtfrom_en(request, test_session,
                                          de_locale, en_locale,
                                          admin_user):
    """User Language Preference fixture with German (de) translated
    from English (en) explicit level"""

    from assembl.models.auth import (
        UserLanguagePreference,
        LanguagePreferenceOrder
    )

    ulp = UserLanguagePreference(
        user=admin_user,
        locale=en_locale,
        translate_to_locale=de_locale,
        preferred_order=0,
        source_of_evidence=LanguagePreferenceOrder.Explicit.value)

    def fin():
        test_session.delete(ulp)
        test_session.flush()

    test_session.add(ulp)
    test_session.flush()
    request.addfinalizer(fin)
    return ulp


@pytest.fixture(scope="function")
def user_language_preference_en_mtfrom_de(request, test_session,
                                          de_locale, en_locale,
                                          admin_user):
    """User Language Preference fixture with English (en) translated
    from German (de) explicit level"""

    from assembl.models.auth import (
        UserLanguagePreference,
        LanguagePreferenceOrder
    )

    ulp = UserLanguagePreference(
        user=admin_user,
        locale=de_locale,
        translate_to_locale=en_locale,
        preferred_order=0,
        source_of_evidence=LanguagePreferenceOrder.Explicit.value)

    def fin():
        test_session.delete(ulp)
        test_session.flush()

    test_session.add(ulp)
    test_session.flush()
    request.addfinalizer(fin)
    return ulp
