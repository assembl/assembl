"""A celery process that translate messages as soon as they are created. Causes deadlocks, not used"""
from abc import abstractmethod

from . import celery
from ..lib.utils import waiting_get
from ..lib.raven_client import capture_exception

_services = {}


class TranslationTable(object):
    @abstractmethod
    def languages_for(self, locale_code, db=None):
        return ()


class PrefCollectionTranslationTable(TranslationTable):
    def __init__(self, service, prefCollection):
        self.service = service
        self.prefCollection = prefCollection

    def languages_for(self, locale_code, db=None):
        pref = self.prefCollection.find_locale(locale_code, db)
        if pref.translate_to:
            loc = self.service.asKnownLocale(pref.translate_to_code)
            if loc:
                return (loc,)
        return ()


class DiscussionPreloadTranslationTable(TranslationTable):
    def __init__(self, service, discussion):
        self.service = service
        self.base_languages = {
            service.asKnownLocale(lang)
            for lang in discussion.discussion_locales}
        self.base_languages.discard(None)

    def languages_for(self, locale_code, db=None):
        locale_code = self.service.asKnownLocale(locale_code)
        return self.base_languages - set(locale_code)


def translate_content(
        content, translation_table=None, service=None,
        constrain_to_discussion_languages=True,
        send_to_changes=False):
    from ..models import Locale
    discussion = content.discussion
    service = service or discussion.translation_service()
    if service.canTranslate is None:
        return
    if translation_table is None:
        translation_table = DiscussionPreloadTranslationTable(
            service, discussion)
    undefined_id = Locale.UNDEFINED_LOCALEID
    changed = False
    # Special case: Short strings.
    und_subject = content.subject.undefined_entry
    und_body = content.body.undefined_entry
    if service.distinct_identify_step and (
            (und_subject and not service.can_guess_locale(und_subject.value)) or
            (und_body and not service.can_guess_locale(und_body.value))):
        combined = ""
        if und_subject:
            combined = und_subject.value or next(
                iter(content.subject.non_mt_entries())).value or ''
        if und_body:
            combined += " " + und_body.value or next(
                iter(content.body.non_mt_entries())).value or ''
        try:
            language, _ = service.identify(
                combined, constrain_to_discussion_languages)
        except:
            capture_exception()
            return changed
        if und_subject:
            und_subject.locale_code = language
            content.db.expire(und_subject, ("locale",))
            content.db.expire(content.subject, ("entries",))
        if und_body:
            und_body.locale_code = language
            content.db.expire(und_body, ("locale",))
            content.db.expire(content.body, ("entries",))

    for prop in ("body", "subject"):
        ls = getattr(content, prop)
        if ls:
            entries = ls.entries_as_dict
            if service.distinct_identify_step and undefined_id in entries:
                entry = entries[undefined_id]
                if entry.value:
                    # assume can_guess_locale = true
                    try:
                        service.confirm_locale(
                            entry, constrain_to_discussion_languages)
                    except:
                        capture_exception()
                        return changed
                    # reload entries
                    ls.db.expire(ls, ("entries",))
                    entries = ls.entries_as_dict
            entries = {service.asKnownLocale(
                        Locale.extract_base_locale(
                            entry.locale_code)): entry
                       for entry in entries.values()}
            entries.pop(None, None)
            originals = ls.non_mt_entries()
            # pick randomly. TODO: Recency order?
            for original in originals:
                source_loc = (service.asKnownLocale(original.locale_code) or
                              original.locale_code) or 'und'
                for dest in translation_table.languages_for(source_loc, content.db):
                    if Locale.compatible(dest, source_loc):
                        continue
                    entry = entries.get(dest, None)
                    is_html = (prop == "body" and
                        content.get_body_mime_type() == 'text/html')
                    if entry is None or (
                            entry.error_code and
                            not service.has_fatal_error(entry)):
                        try:
                            result = service.translate_lse(
                                original,
                                Locale.get_or_create(dest, content.db),
                                is_html=is_html)
                        except:
                            capture_exception()
                            return changed
                        # recalculate, may have changed
                        source_loc = (
                            service.asKnownLocale(original.locale_code) or
                            original.locale_code)
                        ls.db.expire(ls, ["entries"])
                        entries[service.asKnownLocale(
                            Locale.extract_base_locale(
                                result.locale_code)) or original.locale_code] = result
                        changed = True
    if changed and send_to_changes:
        content.send_to_changes()
    return changed


@celery.task(ignore_result=True, shared=False)
def translate_content_task(content_id):
    from ..models import Content
    content = waiting_get(Content, content_id, True)
    translate_content(content)


@celery.task(ignore_result=True, shared=False)
def translate_discussion(
        discussion_id, translation_table=None,
        constrain_to_discussion_languages=True,
        send_to_changes=False):
    from ..models import Discussion
    discussion = Discussion.get(discussion_id)
    service = discussion.translation_service()
    if service.canTranslate is None:
        return
    if translation_table is None:
        translation_table = DiscussionPreloadTranslationTable(
            service, discussion)
    changed = False
    for post in discussion.posts:
        changed |= translate_content(
            post, translation_table, service,
            constrain_to_discussion_languages, send_to_changes)
    return changed
