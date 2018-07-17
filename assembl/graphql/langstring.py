import graphene
from sqlalchemy import inspect

import assembl.graphql.docstrings as docs
from assembl import models
from assembl.models.auth import LanguagePreferenceCollection


def to_known_locale_code(locale_code):
    locale_code = locale_code.replace('-', '_')
    if locale_code == 'nb':
        return 'no'

    return locale_code


def resolve_langstring(langstring, locale_code):
    """If locale_code is None, return the best lang based on user prefs,
    otherwise respect the locale_code to return the right translation.
    If no translation found, fallback to best lang behavior.
    """
    if langstring is None:
        return None

    entries = langstring.entries
    if not entries:
        return None

    try:
        if locale_code:
            locale_code = to_known_locale_code(locale_code)
            closest = langstring.closest_entry(locale_code)
            if closest:
                return closest.value

            english = langstring.closest_entry('en')
            if english:
                return english.value

        return langstring.best_lang(
            LanguagePreferenceCollection.getCurrent(), False).value

    except Exception:
        # Anything that goes wrong with clean_input, return the original
        return langstring.first_original().value


def resolve_langstring_entries(obj, attr):
    langstring = getattr(obj, attr, None)
    if langstring is None or langstring is models.LangString.EMPTY:
        return []

    entries = []
    for entry in sorted(langstring.entries, key=lambda e: e.locale_code):
        entries.append(
            LangStringEntry(
                locale_code=entry.locale.base_locale,
                error_code=entry.error_code,
                translated_from_locale_code=entry.locale.machine_translated_from,  # noqa: E501
                value=entry.value or '',
            )
        )

    return entries


def resolve_best_langstring_entries(langstring, target_locale=None):
    if langstring is None or langstring is models.LangString.EMPTY:
        return []

    entries = []
    if target_locale:
        target_locale = to_known_locale_code(target_locale)
        entry = langstring.closest_entry(target_locale)
        if entry:
            entries.append(entry)
            if entry.is_machine_translated:
                entry = langstring.closest_entry(
                    entry.locale.machine_translated_from, filter_errors=False)
                assert entry, "closest original entry not found"
                entries.append(entry)
        else:
            entries.append(langstring.first_original())
        return entries

    # use request's idea of target_locale
    lsentries = langstring.best_entries_in_request_with_originals()
    lp = LanguagePreferenceCollection.getCurrent()
    for entry in lsentries:
        entries.append(
            LangStringEntry(
                locale_code=entry.locale.base_locale,
                error_code=entry.error_code,
                translated_from_locale_code=entry.locale.machine_translated_from,  # noqa: E501
                supposed_understood=not lp.find_locale(
                    entry.locale.base_locale).translate_to_locale,
                value=entry.value or '',
            )
        )

    return entries


def langstring_from_input_entries(entries):
    """Return a LangString SA object based on GraphQL LangStringEntryInput entries.
    """
    if entries is not None and len(entries) > 0:
        langstring = models.LangString.create(
            entries[0]['value'],
            entries[0]['locale_code'])
        for entry in entries[1:]:
            locale_id = models.Locale.get_id_of(entry['locale_code'])
            langstring.add_entry(
                models.LangStringEntry(
                    langstring=langstring,
                    value=entry['value'],
                    locale_id=locale_id
                )
            )

        return langstring

    return None


def update_langstring_from_input_entries(obj, attr, entries):
    """Update langstring from getattr(obj, attr) based on GraphQL
    LangStringEntryInput entries.
    """
    if entries is None:
        return
    langstring = getattr(obj, attr, None)
    if langstring is None:
        new_langstring = langstring_from_input_entries(entries)
        if new_langstring is not None:
            setattr(obj, attr, new_langstring)
        return

    locales = set()
    for entry in entries:
        locales.add(entry['locale_code'])
        langstring.add_value(entry['value'], entry['locale_code'])
    for entry in langstring.non_mt_entries():
        if entry.locale_code not in locales:
            entry.is_tombstone = True

    if inspect(langstring).persistent:
        langstring.db.expire(langstring, ['entries'])
    langstring.db.flush()


class LangStringEntryFields(graphene.AbstractType):
    value = graphene.String(required=False, description=docs.LangString.value)
    locale_code = graphene.String(required=True, description=docs.LangString.locale_code)


class LangStringEntry(graphene.ObjectType, LangStringEntryFields):
    translated_from_locale_code = graphene.String(required=False, description=docs.LangString.translated_from_locale_code)
    supposed_understood = graphene.Boolean(required=False, description=docs.LangString.supposed_understood)
    error_code = graphene.Int(required=False, description=docs.LangString.error_code)


class LangStringEntryInput(graphene.InputObjectType, LangStringEntryFields):
    pass
