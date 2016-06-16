# -*- coding: utf-8 -*-

import pytest


@pytest.fixture(scope="function")
def langstring_entry_values():
    return {
        "subject": {
            "english":
                u"Here is an English subject that is very cool and hip.",
            "french":
                u"Voici un sujet anglais qui " +
                u"est très cool et branché.",
            "italian": u"Ecco un soggetto inglese che " +
                       u"è molto cool e alla moda.",
            "german": u"Hier ist ein englisches Thema, " +
                      u"das sehr cool und hip ist.",
            "turkish": u"Burada çok serin ve kalça bir İngiliz konudur.",
        },
        "body": {
            "english": u"Here is an English body that is " +
                       u"very cool and hip. And it is also longer.",
            "french": u"Voici un body anglais qui est très cool et branché. " +
                      u"Et il est également plus longue.",
            "italian": u"Qui è un organismo inglese che " +
                       u" è molto cool e alla moda. Ed è anche più.",
            "german": u"Hier ist ein englischer Körper, die sehr cool " +
                      u"und hip ist. Und es ist auch länger.",
            "turkish": u"Burada çok serin ve kalça bir İngiliz" +
                       u"organıdır. Ve aynı zamanda daha uzun."
        }
    }


@pytest.fixture(scope="function")
def en_langstring_entry(request, test_session, en_locale,
                        langstring_body, langstring_entry_values):
    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=en_locale,
        value=langstring_entry_values.get('body').get('english')
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
    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=fr_locale,
        value=langstring_entry_values.get('body').get('french')
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
    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=it_locale,
        value=langstring_entry_values.get('body').get('italian')
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
    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=tr_locale,
        value=langstring_entry_values.get('body').get('turkish')
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
    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=undefined_locale,
        value=langstring_entry_values.get('body').get('english')
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
    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=non_linguistic_locale,
        value=langstring_entry_values.get('body').get('english')
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
    print "Creating fr_from_en_langstring_entry"
    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=fr_from_en_locale,
        value=langstring_entry_values.get('body').get('french')
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

    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=en_from_fr_locale,
        value=langstring_entry_values.get('body').get('english')
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
    print "Creating fr_from_en_langstring_entry"
    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=it_from_en_locale,
        value=langstring_entry_values.get('body').get('italian')
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

    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=en_from_it_locale,
        value=langstring_entry_values.get('body').get('english')
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
    print "Creating fr_from_en_langstring_entry"
    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=it_from_fr_locale,
        value=langstring_entry_values.get('body').get('italian')
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

    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=fr_from_it_locale,
        value=langstring_entry_values.get('body').get('french')
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

    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=en_from_tr_locale,
        value=langstring_entry_values.get('body').get('english')
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

    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=de_from_tr_locale,
        value=langstring_entry_values.get('body').get('german')
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

    from assembl.models.langstrings import LangStringEntry

    entry = LangStringEntry(
        locale_confirmed=False,
        langstring=langstring_body,
        locale=fr_from_und_locale,
        value=langstring_entry_values.get('body').get('french')
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
    from assembl.models.langstrings import LangString

    ls = LangString()
    test_session.add(ls)
    test_session.flush()

    def fin():
        test_session.delete(ls)
        test_session.flush()

    request.addfinalizer(fin)
    return ls
