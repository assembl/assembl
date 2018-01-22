"""Utilities for locale conversion, between posix, iso639 1 & 2;
and for pyramid locale negotiation."""
from pyramid.i18n import TranslationStringFactory, Localizer
from pyramid.i18n import default_locale_negotiator
from iso639 import (is_valid639_2, is_valid639_1, to_iso639_1)

from .config import get_config


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
        locale_code = get_config().get('available_languages', 'fr_CA en_CA').\
            split()[0]
        localizer = Localizer(locale_code)
    return localizer


def use_underscore(locale):
    # Normalize fr-ca to fr_ca
    if locale and '-' in locale:
        return '_'.join(locale.split('-'))
    return locale


def to_posix_string(locale_code):
    if not locale_code:
        return None
    # Normalize fra-ca to fr_CA
    locale_code = use_underscore(locale_code)
    locale_parts = locale_code.split("_")
    # Normalize first component
    lang = locale_parts[0]
    if is_valid639_1(lang):
        posix_lang = lang
    elif is_valid639_2(lang):
        temp = to_iso639_1(lang)
        posix_lang = temp if temp else lang
    else:
        # Aryan, not sure what case is being covered here
        full_name = lang.lower().capitalize()
        if is_valid639_2(full_name):
            posix_lang = to_iso639_1(full_name)
        else:
            raise ValueError(
                "The input %s in not a valid code to convert to posix format" %
                (locale_code,))
    locale_parts[0] = posix_lang
    if len(locale_parts) > 4:
        raise ValueError("This locale has too many parts: "+locale_code)
    elif len(locale_parts) == 4:
        # Drop dialect. Sorry.
        locale_parts.pop()
    if len(locale_parts) > 1:
        # Normalize Country
        if len(locale_parts[-1]) == 2:
            locale_parts[-1] = locale_parts[-1].upper()
        elif len(locale_parts[-1]) != 4:
            raise ValueError(
                "The last part is not a script or country: "+locale_code)
        # Normalize script
        if len(locale_parts[1]) == 4:
            locale_parts[1] = locale_parts[1].capitalize()
    return "_".join(locale_parts)


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
        settings = get_config()
        available = settings.get('available_languages', 'en_CA fr_CA').split()
        avail_langs = {get_language(loc): loc
                       for loc in reversed(available) if '_' in loc}
        locale_with_country = avail_langs.get(locale, None)
        if not locale_with_country:
            if is_valid639_1(locale):
                return locale
            return None
        return locale_with_country
        # TODO: Default countries for languages. Look in pycountry?
    return locale


_special_cases = {
    'zh': 'zh_Hans_CN',  # assume mainland by default
    'zh_CN': 'zh_Hans_CN',
    'zh_TW': 'zh_Hant_TW',
}


def strip_country(locale):
    # assuming a posix locale
    locale = _special_cases.get(locale, locale)
    if '_' in locale:
        locale = locale.split("_")
        if len(locale[-1]) == 2:
            locale.pop()
        return "_".join(locale)
    return locale


def get_preferred_languages(session, user_id):
    from ..models import UserLanguagePreference, Locale
    prefs = (session.query(UserLanguagePreference)
             .filter_by(user_id=user_id)
             .order_by(UserLanguagePreference.preferred_order))
    return [Locale.code_for_id(p.locale_id) for p in prefs]


def locale_negotiator(request):
    settings = get_config()
    available = settings.get('available_languages').split()
    locale = (request.params.get('_LOCALE_', None) or
              request.cookies.get('_LOCALE_', None))
    # TODO: Set User preference in this function.
    if not locale:
        from assembl.auth.util import discussion_from_request
        from assembl.models import get_session_maker
        user_id = request.authenticated_userid
        if user_id:
            prefs = get_preferred_languages(get_session_maker()(), user_id)
            for locale in prefs:
                if locale in available:
                    break
                if '_' not in locale:
                    locale = ensure_locale_has_country(locale)
                    if locale and locale in available:
                        break
            else:
                locale = None
        if locale is None:
            discussion = discussion_from_request(request)
            if discussion:
                for locale in discussion.discussion_locales:
                    if locale in available:
                        break
                    if '_' not in locale:
                        locale = ensure_locale_has_country(locale)
                        if locale and locale in available:
                            break
                else:
                    locale = None
    if not locale:
        locale = to_posix_string(default_locale_negotiator(request))
    if locale and locale not in available:
        locale_with_country = ensure_locale_has_country(locale)
        if locale_with_country:
            locale = locale_with_country
    if not locale:
        locale = to_posix_string(request.accept_language.best_match(
            available, settings.get('pyramid.default_locale_name', 'en')))
    request._LOCALE_ = locale
    return locale
