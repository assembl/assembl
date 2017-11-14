# -*- coding: utf-8 -*-

import pytest


@pytest.fixture(scope="function")
def langstring_entry_values():
    """Dict fixture of content in multiple languages"""
    return {
        "subject": {
            "en":
                u"Here is an English subject that is very cool and hip.",
            "fr":
                u"Voici un sujet anglais qui " +
                u"est très cool et branché.",
            "it": u"Ecco un soggetto inglese che " +
                       u"è molto cool e alla moda.",
            "de": u"Hier ist ein englisches Thema, " +
                      u"das sehr cool und hip ist.",
            "tr": u"Burada çok serin ve kalça bir İngiliz konudur.",
        },
        "body": {
            "en": u"Here is an English body that is " +
                       u"very cool and hip. And it is also longer.",
            "fr": u"Voici un body anglais qui est très cool et branché. " +
                      u"Et il est également plus longue.",
            "it": u"Qui è un organismo inglese che " +
                       u" è molto cool e alla moda. Ed è anche più.",
            "de": u"Hier ist ein englischer Körper, die sehr cool " +
                      u"und hip ist. Und es ist auch länger.",
            "tr": u"Burada çok serin ve kalça bir İngiliz" +
                       u"organıdır. Ve aynı zamanda daha uzun."
        }
    }


@pytest.fixture(scope="function")
def en_langstring_entry(request, test_session, en_locale,
                        langstring_body, langstring_entry_values):
    """LangStringEntry fixture with English locale"""

    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=en_locale,
        value=langstring_entry_values.get('body').get('en')
    )

    test_session.expire(langstring_body, ["entries"])

    def fin():
        test_session.delete(entry)
        test_session.flush()

    test_session.add(entry)
    test_session.flush()
    request.addfinalizer(fin)
    return entry


@pytest.fixture(scope="function")
def fr_langstring_entry(request, test_session, fr_locale,
                        langstring_body, langstring_entry_values):
    """LangStringEntry fixture with French locale"""

    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=fr_locale,
        value=langstring_entry_values.get('body').get('fr')
    )

    test_session.expire(langstring_body, ["entries"])

    def fin():
        test_session.delete(entry)
        test_session.flush()

    test_session.add(entry)
    test_session.flush()
    request.addfinalizer(fin)
    return entry


@pytest.fixture(scope="function")
def it_langstring_entry(request, test_session, it_locale,
                        langstring_body, langstring_entry_values):
    """LangStringEntry fixture with Italian locale"""

    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=it_locale,
        value=langstring_entry_values.get('body').get('it')
    )

    test_session.expire(langstring_body, ["entries"])

    def fin():
        test_session.delete(entry)
        test_session.flush()

    test_session.add(entry)
    test_session.flush()
    request.addfinalizer(fin)
    return entry


@pytest.fixture(scope="function")
def tr_langstring_entry(request, test_session, tr_locale,
                        langstring_body, langstring_entry_values):
    """LangStringEntry fixture with Turkish locale"""

    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=tr_locale,
        value=langstring_entry_values.get('body').get('tr')
    )

    test_session.expire(langstring_body, ["entries"])

    def fin():
        test_session.delete(entry)
        test_session.flush()

    test_session.add(entry)
    test_session.flush()
    request.addfinalizer(fin)
    return entry


@pytest.fixture(scope="function")
def und_langstring_entry(request, test_session, undefined_locale,
                         langstring_body, langstring_entry_values):
    """LangStringEntry fixture with undefined locale"""

    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=undefined_locale,
        value=langstring_entry_values.get('body').get('en')
    )

    test_session.expire(langstring_body, ["entries"])

    def fin():
        test_session.delete(entry)
        test_session.flush()

    test_session.add(entry)
    test_session.flush()
    request.addfinalizer(fin)
    return entry


@pytest.fixture(scope="function")
def non_linguistic_langstring_entry(request, test_session,
                                    non_linguistic_locale, langstring_body,
                                    langstring_entry_values):
    """LangStringEntry fixture with non_linguistic locale"""

    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=non_linguistic_locale,
        value=langstring_entry_values.get('body').get('en')
    )

    test_session.expire(langstring_body, ["entries"])

    def fin():
        test_session.delete(entry)
        test_session.flush()

    test_session.add(entry)
    test_session.flush()
    request.addfinalizer(fin)
    return entry


@pytest.fixture(scope="function")
def fr_from_en_langstring_entry(request, test_session, fr_from_en_locale,
                                langstring_body, en_langstring_entry,
                                langstring_entry_values):
    """LangStringEntry fixture with EN locale + FR from EN locale"""

    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=fr_from_en_locale,
        value=langstring_entry_values.get('body').get('fr')
    )

    test_session.expire(langstring_body, ["entries"])

    def fin():
        print "Destroying fr_from_en_langstring_entry"
        test_session.delete(entry)
        test_session.flush()

    test_session.add(entry)
    test_session.flush()
    request.addfinalizer(fin)
    return entry


@pytest.fixture(scope="function")
def en_from_fr_langstring_entry(request, test_session, en_from_fr_locale,
                                langstring_body, fr_langstring_entry,
                                langstring_entry_values):
    """LangStringEntry fixture with FR locale + EN from FR locale"""

    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=en_from_fr_locale,
        value=langstring_entry_values.get('body').get('en')
    )

    test_session.expire(langstring_body, ["entries"])

    def fin():
        test_session.delete(entry)
        test_session.flush()

    test_session.add(entry)
    test_session.flush()
    request.addfinalizer(fin)
    return entry


@pytest.fixture(scope="function")
def it_from_en_langstring_entry(request, test_session, it_from_en_locale,
                                langstring_body, en_langstring_entry,
                                langstring_entry_values):
    """LangStringEntry fixture with EN locale + IT from EN locale"""

    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=it_from_en_locale,
        value=langstring_entry_values.get('body').get('it')
    )

    test_session.expire(langstring_body, ["entries"])

    def fin():
        test_session.delete(entry)
        test_session.flush()

    test_session.add(entry)
    test_session.flush()
    request.addfinalizer(fin)
    return entry


@pytest.fixture(scope="function")
def en_from_it_langstring_entry(request, test_session, en_from_it_locale,
                                langstring_body, it_langstring_entry,
                                langstring_entry_values):
    """LangStringEntry fixture with IT locale + EN from IT locale"""

    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=en_from_it_locale,
        value=langstring_entry_values.get('body').get('en')
    )

    test_session.expire(langstring_body, ["entries"])

    def fin():
        test_session.delete(entry)
        test_session.flush()

    test_session.add(entry)
    test_session.flush()
    request.addfinalizer(fin)
    return entry


@pytest.fixture(scope="function")
def it_from_fr_langstring_entry(request, test_session, it_from_fr_locale,
                                langstring_body, fr_langstring_entry,
                                langstring_entry_values):
    """LangStringEntry fixture with FR locale + IT from FR locale"""

    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=it_from_fr_locale,
        value=langstring_entry_values.get('body').get('it')
    )

    test_session.expire(langstring_body, ["entries"])

    def fin():
        test_session.delete(entry)
        test_session.flush()

    test_session.add(entry)
    test_session.flush()
    request.addfinalizer(fin)
    return entry


@pytest.fixture(scope="function")
def fr_from_it_langstring_entry(request, test_session, fr_from_it_locale,
                                langstring_body, it_langstring_entry,
                                langstring_entry_values):
    """LangStringEntry fixture with IT locale + FR from IT locale"""

    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=fr_from_it_locale,
        value=langstring_entry_values.get('body').get('fr')
    )

    test_session.expire(langstring_body, ["entries"])

    def fin():
        test_session.delete(entry)
        test_session.flush()

    test_session.add(entry)
    test_session.flush()
    request.addfinalizer(fin)
    return entry


@pytest.fixture(scope="function")
def en_from_tr_langstring_entry(request, test_session, en_from_tr_locale,
                                langstring_body, tr_langstring_entry,
                                langstring_entry_values):
    """LangStringEntry fixture with TR locale + EN from TR locale"""

    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=en_from_tr_locale,
        value=langstring_entry_values.get('body').get('en')
    )

    test_session.expire(langstring_body, ["entries"])

    def fin():
        test_session.delete(entry)
        test_session.flush()

    test_session.add(entry)
    test_session.flush()
    request.addfinalizer(fin)
    return entry


@pytest.fixture(scope="function")
def de_from_tr_langstring_entry(request, test_session, de_from_tr_locale,
                                langstring_body, tr_langstring_entry,
                                langstring_entry_values):
    """LangStringEntry fixture with TR locale + DE from TR locale"""

    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=de_from_tr_locale,
        value=langstring_entry_values.get('body').get('de')
    )

    test_session.expire(langstring_body, ["entries"])

    def fin():
        test_session.delete(entry)
        test_session.flush()

    test_session.add(entry)
    test_session.flush()
    request.addfinalizer(fin)
    return entry


@pytest.fixture(scope="function")
def fr_from_und_langstring_entry(request, test_session, fr_from_und_locale,
                                 langstring_body, und_langstring_entry,
                                 langstring_entry_values):
    """LangStringEntry fixture with und locale + FR from und locale"""

    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=fr_from_und_locale,
        value=langstring_entry_values.get('body').get('fr')
    )

    test_session.expire(langstring_body, ["entries"])

    def fin():
        test_session.delete(entry)
        test_session.flush()

    test_session.add(entry)
    test_session.flush()
    request.addfinalizer(fin)
    return entry


@pytest.fixture(scope="function")
def langstring_body(request, test_session):
    """An Empty Langstring fixture"""

    from assembl.models.langstrings import LangString

    ls = LangString()
    test_session.add(ls)
    test_session.flush()

    def fin():
        test_session.delete(ls)
        test_session.flush()

    request.addfinalizer(fin)
    return ls


@pytest.fixture(scope="function")
def langstring_subject(request, test_session):
    """An Empty Langstring fixture"""

    from assembl.models.langstrings import LangString

    ls = LangString()
    test_session.add(ls)
    test_session.flush()

    def fin():
        test_session.delete(ls)
        test_session.flush()

    request.addfinalizer(fin)
    return ls


@pytest.fixture
def ambiguous_langstring(request, test_session, undefined_locale):
    from assembl.models.langstrings import LangString

    # This string is chosen because it is close to 50/50
    # en vs fr in the langdetect algorithm.
    ls = LangString.create("testa", "und")
    test_session.add(ls)
    test_session.flush()

    def fin():
        for entry in ls.entries:
            test_session.delete(entry)
        test_session.delete(ls)
        test_session.flush()

    request.addfinalizer(fin)
    return ls

@pytest.fixture
def en_langstring(request, test_session, undefined_locale):
    from assembl.models.langstrings import LangString

    ls = LangString.create("The quick brown fox jumps over the lazy dog.", "en")
    test_session.add(ls)
    test_session.flush()

    def fin():
        for entry in ls.entries:
            test_session.delete(entry)
        test_session.delete(ls)
        test_session.flush()

    request.addfinalizer(fin)
    return ls
