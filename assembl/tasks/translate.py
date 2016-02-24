from collections import defaultdict

from celery import Celery

from . import init_task_config, config_celery_app
from ..lib.utils import waiting_get

# broker specified
translation_celery_app = Celery('celery_tasks.translate')

_services = {}




def lang_list_as_translation_table(service, language_list):
    base_languages = {service.asKnownLocale(lang) for lang in languages}
    return {lang: base_languages - set(lang) for lang in base_languages}


def user_pref_as_translation_table(user, service):
    from assembl.models import Locale
    table = defaultdict(set)
    for pref in user.language_preference:
        if pref.translate_to:
            table[service.asKnownLocale(
                Locale.code_for_id(pref.locale_id))].add(
                service.asKnownLocale(Locale.code_for_id(pref.translate_to)))
    return table


def complete_lang_and_trans_table(
        service, discussion, translation_table, languages=None):
    if not translation_table:
        languages = languages or discussion.discussion_locales
        base_languages = {service.asKnownLocale(lang) for lang in languages}
        translation_table = {
            lang: base_languages - set((lang,)) for lang in base_languages}
    if not languages:
        languages = set()
        for targets in translation_table.itervalues():
            languages.update(targets)
    return translation_table, languages


def translate_content(
        content, translation_table=None, service=None, languages=None,
        send_to_changes=False):
    from ..models import Locale
    from assembl.lib.raven_client import get_raven_client
    raven_client = get_raven_client()
    discussion = content.discussion
    service = service or discussion.translation_service()
    if not service:
        return
    translation_table, languages = complete_lang_and_trans_table(
        service, discussion, translation_table, languages)
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
                iter(content.subject.non_mt_entries())).value
        if und_body:
            combined += " " + und_subject.value or next(
                iter(content.subject.non_mt_entries())).value
        try:
            language, _ = service.identify(combined, languages)
        except:
            if raven_client:
                raven_client.captureException()
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
                        service.confirm_locale(entry, languages)
                    except:
                        if raven_client:
                            raven_client.captureException()
                        return changed
                    # reload entries
                    ls.db.expire(ls, ("entries",))
                    entries = ls.entries_as_dict
            known = {service.asKnownLocale(
                        Locale.extract_base_locale(
                            Locale.code_for_id(loc_id)))
                     for loc_id in entries}
            originals = ls.non_mt_entries()
            # pick randomly. TODO: Recency order?
            for original in originals:
                source_loc = (service.asKnownLocale(original.locale_code) or
                              original.locale_code)
                for dest in translation_table.get(source_loc, languages):
                    if dest not in known:
                        if Locale.len_common_parts(dest, source_loc):
                            continue
                        try:
                            service.translate_lse(
                                original, Locale.get_or_create(dest, content.db))
                        except:
                            if raven_client:
                                raven_client.captureException()
                            return changed
                        # recalculate, may have changed
                        source_loc = (service.asKnownLocale(original.locale_code) or
                              original.locale_code)
                        ls.db.expire(ls, ["entries"])
                        known.add(dest)
                        changed = True
    if changed and send_to_changes:
        content.send_to_changes()
    return changed


@translation_celery_app.task(ignore_result=True)
def translate_content_task(content_id):
    init_task_config(translation_celery_app)
    from ..models import Content
    content = waiting_get(Content, content_id, True)
    translate_content(content)


@translation_celery_app.task(ignore_result=True)
def translate_discussion(
        discussion_id, translation_table=None, languages=None,
        send_to_changes=False):
    from ..models import Discussion
    discussion = Discussion.get(discussion_id)
    service = discussion.translation_service()
    if not service:
        return
    translation_table, languages = complete_lang_and_trans_table(
        service, discussion, translation_table, languages)
    changed = False
    for post in discussion.posts:
        changed |= translate_content(
            post, translation_table, service, languages, send_to_changes)
    return changed


def includeme(config):
    config_celery_app(translation_celery_app, config.registry.settings)
