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
    if '-' in locale:
        return '_'.join(locale.split('-'))
    return locale

def to_posix_format(lang_code):
    # Normalize fra-ca to fr_CA
    lang_code = use_underscore(lang_code)
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
        return locale.split('_')[1]
    # otherwise None
