import pytest


@pytest.fixture(scope="function")
def en_ca_locale(request, test_session):
    """Canadian English (en_CA) locale fixture"""

    from assembl.models.langstrings import Locale

    locale = Locale.get_or_create("en_CA", test_session)

    def fin():
        Locale.reset_cache()
        test_session.delete(locale)
        test_session.flush()

    request.addfinalizer(fin)
    return locale


@pytest.fixture(scope="function")
def en_locale(request, test_session):
    """English (en) locale fixture"""

    from assembl.models.langstrings import Locale
    locale = Locale.get_or_create("en", test_session)

    def fin():
        test_session.delete(locale)
        test_session.flush()
        Locale.reset_cache()

    request.addfinalizer(fin)
    return locale


@pytest.fixture(scope="function")
def fr_locale(request, test_session):
    """French (fr) locale fixture"""

    from assembl.models.langstrings import Locale
    locale = Locale.get_or_create("fr", test_session)

    def fin():
        test_session.delete(locale)
        test_session.flush()
        Locale.reset_cache()

    request.addfinalizer(fin)
    return locale


@pytest.fixture(scope="function")
def it_locale(request, test_session):
    """Italian (it) locale fixture"""

    from assembl.models.langstrings import Locale
    locale = Locale.get_or_create("it", test_session)

    def fin():
        test_session.delete(locale)
        test_session.flush()
        Locale.reset_cache()

    request.addfinalizer(fin)
    return locale


@pytest.fixture(scope="function")
def de_locale(request, test_session):
    """German (de) locale fixture"""

    from assembl.models.langstrings import Locale

    locale = Locale.get_or_create("de", test_session)

    def fin():
        test_session.delete(locale)
        test_session.flush()
        Locale.reset_cache()

    request.addfinalizer(fin)
    return locale


@pytest.fixture(scope="function")
def tr_locale(request, test_session):
    """Turkish (tr) locale fixture"""

    from assembl.models.langstrings import Locale

    locale = Locale.get_or_create("tr", test_session)

    def fin():
        test_session.delete(locale)
        test_session.flush()
        Locale.reset_cache()

    request.addfinalizer(fin)
    return locale


@pytest.fixture(scope="function")
def non_linguistic_locale(request, test_session):
    """non-linguistic locale fixture"""

    from assembl.models.langstrings import Locale

    locale = Locale.get_or_create(Locale.NON_LINGUISTIC, test_session)

    def fin():
        test_session.delete(locale)
        test_session.flush()
        Locale.reset_cache()

    request.addfinalizer(fin)
    return locale


@pytest.fixture(scope="function")
def undefined_locale(request, test_session):
    """undefined (und) locale fixture"""

    from assembl.models.langstrings import Locale

    locale = Locale.get_or_create(Locale.UNDEFINED, test_session)

    def fin():
        test_session.delete(locale)
        test_session.flush()
        Locale.reset_cache()

    request.addfinalizer(fin)
    return locale


@pytest.fixture(scope="function")
def fr_from_en_locale(request, test_session, en_locale, fr_locale):
    """French (fr) locale fixture, machine translated from English (en)"""

    from assembl.models.langstrings import Locale
    locale = Locale.create_mt_locale(en_locale, fr_locale, db=test_session)

    def fin():
        test_session.delete(locale)
        test_session.flush()
        Locale.reset_cache()

    request.addfinalizer(fin)
    return locale


@pytest.fixture(scope="function")
def en_from_fr_locale(request, test_session, en_locale, fr_locale):
    """English (en) locale fixture, machine translated from French (fr)"""

    from assembl.models.langstrings import Locale

    locale = Locale.create_mt_locale(fr_locale, en_locale, db=test_session)

    def fin():
        test_session.delete(locale)
        test_session.flush()
        Locale.reset_cache()

    request.addfinalizer(fin)
    return locale


@pytest.fixture(scope="function")
def it_from_en_locale(request, test_session, en_locale, it_locale):
    """Italian (it) locale fixture, machine translated from English (en)"""

    from assembl.models.langstrings import Locale
    locale = Locale.create_mt_locale(en_locale, it_locale, db=test_session)

    def fin():
        test_session.delete(locale)
        test_session.flush()
        Locale.reset_cache()

    request.addfinalizer(fin)
    return locale


@pytest.fixture(scope="function")
def en_from_it_locale(request, test_session, en_locale, it_locale):
    """English (en) locale fixture, machine translated from Italian (it)"""

    from assembl.models.langstrings import Locale

    locale = Locale.create_mt_locale(it_locale, en_locale, db=test_session)

    def fin():
        test_session.delete(locale)
        test_session.flush()
        Locale.reset_cache()

    request.addfinalizer(fin)
    return locale


@pytest.fixture(scope="function")
def fr_from_it_locale(request, test_session, fr_locale, it_locale):
    """French (fr) locale fixture, machine translated from Italian (it)"""

    from assembl.models.langstrings import Locale
    locale = Locale.create_mt_locale(it_locale, fr_locale, db=test_session)

    def fin():
        test_session.delete(locale)
        test_session.flush()
        Locale.reset_cache()

    request.addfinalizer(fin)
    return locale


@pytest.fixture(scope="function")
def it_from_fr_locale(request, test_session, fr_locale, it_locale):
    """Italian (it) locale fixture, machine translated from French (fr)"""

    from assembl.models.langstrings import Locale

    locale = Locale.create_mt_locale(fr_locale, it_locale, db=test_session)

    def fin():
        test_session.delete(locale)
        test_session.flush()
        Locale.reset_cache()

    request.addfinalizer(fin)
    return locale


@pytest.fixture(scope="function")
def fr_from_und_locale(request, test_session, undefined_locale, fr_locale):
    """French (fr) locale fixture, machine translated from undefined (und)"""

    from assembl.models.langstrings import Locale
    locale = Locale.create_mt_locale(undefined_locale, fr_locale,
                                     db=test_session)

    def fin():
        test_session.delete(locale)
        test_session.flush()
        Locale.reset_cache()

    request.addfinalizer(fin)
    return locale


@pytest.fixture(scope="function")
def de_from_en_locale(request, test_session, de_locale, en_locale):
    """German (de) locale fixture, machine translated from English (en)"""

    from assembl.models.langstrings import Locale
    locale = Locale.create_mt_locale(en_locale, de_locale,
                                     db=test_session)

    def fin():
        test_session.delete(locale)
        test_session.flush()
        Locale.reset_cache()

    request.addfinalizer(fin)
    return locale


@pytest.fixture(scope="function")
def de_from_tr_locale(request, test_session, de_locale, tr_locale):
    """German (de) locale fixture, machine translated from Turkish (tr)"""

    from assembl.models.langstrings import Locale
    locale = Locale.create_mt_locale(tr_locale, de_locale,
                                     db=test_session)

    def fin():
        test_session.delete(locale)
        test_session.flush()
        Locale.reset_cache()

    request.addfinalizer(fin)
    return locale


@pytest.fixture(scope="function")
def en_from_de_locale(request, test_session, de_locale, en_locale):
    """English (en) locale fixture, machine translated from German (de)"""

    from assembl.models.langstrings import Locale
    locale = Locale.create_mt_locale(de_locale, en_locale,
                                     db=test_session)

    def fin():
        test_session.delete(locale)
        test_session.flush()
        Locale.reset_cache()

    request.addfinalizer(fin)
    return locale


@pytest.fixture(scope="function")
def tr_from_en_locale(request, test_session, tr_locale, en_locale):
    """Turkish (tr) locale fixture, machine translated from English (en)"""

    from assembl.models.langstrings import Locale
    locale = Locale.create_mt_locale(en_locale, tr_locale,
                                     db=test_session)

    def fin():
        test_session.delete(locale)
        test_session.flush()
        Locale.reset_cache()

    request.addfinalizer(fin)
    return locale


@pytest.fixture(scope="function")
def en_from_tr_locale(request, test_session, tr_locale, en_locale):
    """English (en) locale fixture, machine translated from Turkish (tr)"""

    from assembl.models.langstrings import Locale
    locale = Locale.create_mt_locale(tr_locale, en_locale,
                                     db=test_session)

    def fin():
        test_session.delete(locale)
        test_session.flush()
        Locale.reset_cache()

    request.addfinalizer(fin)
    return locale
