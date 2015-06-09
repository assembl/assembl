from pyramid.i18n import TranslationStringFactory, Localizer
from .config import get_config
from iso639 import (is_valid639_2, is_valid639_1, to_iso639_2, to_iso639_1)


_ = TranslationStringFactory('assembl')


def get_localizer(request=None):
    """Get the localizer.
    Searches the given request, or the current request,
    or provides a default locale."""
    if request is None:
        from pyramid.threadlocal import get_current_request
        request = get_current_request()
    if request:
        localizer = request.localizer
    else:
        locale_name = get_config().get('available_languages', 'fr_CA en_CA').split()[0]
        localizer = Localizer(locale_name)
    return localizer

def use_underscore(locale):
    # Normalize fr-ca to fr_ca
    if locale and '-' in locale:
        return '_'.join(locale.split('-'))
    return locale

def to_posix_format(lang_code):
    # Normalize fra-ca to fr_CA
    lang_code = use_underscore(lang_code)
    if not lang_code:
        return None
    if '_' in lang_code:
        # ISO format, must convert to POSIX format
        lang, country = lang_code.split('_')[:2]
    else:
        lang, country = lang_code, None
    if is_valid639_1(lang):
        posix_lang = lang
    elif is_valid639_2(lang):
        posix_lang = to_iso639_1(lang)
    else:
        full_name = lang.lower().capitalize()
        if is_valid639_2(full_name):
            posix_lang = to_iso639_1(full_name)
        else:
            return
    if country:
        return '_'.join([posix_lang.lower(), country.upper()])
    else:
        return posix_lang.lower()


def get_language(locale):
    return (use_underscore(locale)+'_').split('_')[0]

def get_country(locale):
    locale = use_underscore(locale)
    if '_' in locale:
        import string
        return string.upper(locale.split('_')[1])
    # otherwise None

def ensure_locale_has_country(locale):
    # assuming a posix locale
    if '_' not in locale:
        # first look in config
        from .config import get_config
        settings = get_config()
        available = settings.get('available_languages', 'en_CA fr_CA').split()
        avail_langs = {get_language(loc): loc for loc in reversed(available) if '_' in loc}
        locale_with_country = avail_langs.get(locale, None)
        if not locale_with_country:
            if is_valid639_1(locale):
                return locale
            return None
        return locale_with_country
        # TODO: Default countries for languages. Look in pycountry?
    return locale
