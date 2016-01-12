from celery import Celery

from pyramid.path import DottedNameResolver

from . import init_task_config, config_celery_app

# broker specified
translation_celery_app = Celery('celery_tasks.translate')

resolver = DottedNameResolver(__package__)

services = {}


def translate_content(content, extra_languages=None):
    from ..models import Locale
    global services
    discussion = content.discussion
    service = discussion.preferences["translation_service"]
    if not service:
        return
    if service not in services:
        cls = resolver.resolve(service)
        services[service] = cls()
    service = services[service]
    languages = discussion.discussion_locales
    languages.extend(extra_languages or ())
    languages = [Locale.get_or_create(locname) for locname in languages]
    languages = [service.asKnownLocale(loc.locale) for loc in languages]
    undefined_id = Locale.UNDEFINED_LOCALEID
    changed = False
    for prop in ("subject", "body"):
        ls = getattr(content, prop)
        if ls:
            entries = ls.entries_as_dict
            if undefined_id in entries:
                service.confirm_locale(entries[undefined_id], languages)
                # reload entries
                ls.db.expire(ls, ("entries_as_dict",))
                entries = ls.entries_as_dict
            known = {service.asKnownLocale(
                        Locale.extract_source_locale(
                            Locale.locale_collection_byid[loc_id]))
                     for loc_id in entries}
            originals = ls.non_mt_entries()
            # pick randomly. TODO: Recency order?
            original = next(iter(originals))
            for base in languages:
                if base not in known:
                    service.translate_lse(original, lang)
                    changed = True
            ls.db.expire(ls, ["entries"])
    if changed:
        content.send_to_changes()
        ls.db.commit()


@translation_celery_app.task(ignore_result=True)
def translate_content_task(content_id, extra_languages=None):
    global services
    init_task_config(translation_celery_app)
    from ..models import Content
    content = Content.get(content_id)
    translate_content(content, extra_languages)


def includeme(config):
    config_celery_app(translation_celery_app, config.registry.settings)
