from abc import abstractmethod
import urllib2

import simplejson as json
from langdetect import detect_langs
from langdetect.detector import LangDetectException

from assembl.lib.abc import abstractclassmethod
from assembl.lib import config
from assembl.models.langstrings import Locale, LangStringEntry, LocaleName


class TranslationService(object):

    @abstractclassmethod
    def canTranslate(cls, source, target):
        return False

    @classmethod
    def asKnownLocale(cls, locale_name):
        return locale_name

    @classmethod
    def asPosixLocale(cls, locale_name):
        return locale_name

    @classmethod
    def can_guess_locale(cls, text):
        # empirical
        return len(text) >= 15

    @classmethod
    def target_locales(cls):
        return ()

    @classmethod
    def target_locale_names(cls, target_locale):
        return LocaleName.names_of_locales_in_locale(
            cls.target_locales(), target_locale)

    def identify(self, text, expected_locales=None):
        "Try to identify locale of text. Boost if one of the expected locales."
        if not text:
            return Locale.UNDEFINED, {Locale.UNDEFINED: 1}
        try:
            expected_locales = expected_locales or {}
            language_data = detect_langs(text)
            data = [(x.prob * (5 if x.lang in expected_locales else 1), x.lang)
                    for x in language_data]
            data.sort(reverse=True)
            return data[0][1], {lang: prob for (prob, lang) in data}
        except LangDetectException:
            if expected_locales:
                return expected_locales[0], {l: 0.5 for l in expected_locales}
            return Locale.UNDEFINED, {
                Locale.UNDEFINED: 0.2, Locale.NON_LINGUISTIC: 0.1}

    def confirm_locale(self, langstring_entry, expected_locales=None):
        lang, data = self.identify(langstring_entry.value, expected_locales)
        data["_service"] = self.__class__.__name__
        changed = langstring_entry.identify_locale(lang, data)
        if changed:
            langstring_entry.db.expire(langstring_entry, ["locale"])
            langstring_entry.db.expire(
                langstring_entry.langstring, ["entries"])

    @abstractmethod
    def translate(self, text, target, source=None):
        if not source or source == Locale.UNDEFINED:
            lang, data = self.identify(text)
            source = Locale.get_or_create(source_name)
        return text

    def get_mt_name(cls, source_name, target_name):
        return "-".join((target_name, "x-mtfrom", source_name))

    def translate_lse(self, langstring_entry, target, retranslate=False):
        if langstring_entry.locale_name == Locale.UNDEFINED:
            self.confirm_locale(langstring_entry)
        source = langstring_entry.locale
        mt_target_name = self.get_mt_name(source.locale, target.locale)
        existing = langstring_entry.langstring.entries_as_dict.get(
            mt_target_name, None)
        if existing and not retranslate:
            return langstring_entry.langstring.entries_as_dict[mt_target_name]
        if not self.canTranslate(source, target):
            return existing
        trans = self.translate(langstring_entry.value, target, source)
        lse = LangStringEntry(
            value=trans,
            locale=Locale.get_or_create(mt_target_name),
            locale_identification_data=json.dumps(dict(
                translator=self.__class__.__name__)),
            langstring_id=langstring_entry.langstring_id)
        langstring_entry.db.add(lse)
        return lse


class DummyTranslationService(TranslationService):
    @classmethod
    def canTranslate(cls, source, target):
        return True

    def translate(self, text, target, source=None):
        return u"Pseudo-translation from %s to %s of: %s" % (
            source.locale, target.locale, text)

    @classmethod
    def target_locale_names(cls, target_locale):
        return LocaleName.names_in_locale(target_locale)


class DummyGoogleTranslationService(TranslationService):
    # Uses public Google API. For testing purposes. Do NOT use in production.
    known_locales = {
        "af", "sq", "ar", "hy", "az", "eu", "be", "bn", "bs", "bg", "ca",
        "ceb", "ny", "zh-CN", "zh-TW", "hr", "cs", "da", "nl", "en", "eo",
        "et", "tl", "fi", "fr", "gl", "ka", "de", "el", "gu", "ht", "ha",
        "iw", "hi", "hmn", "hu", "is", "ig", "id", "ga", "it", "ja", "jw",
        "kn", "kk", "km", "ko", "lo", "la", "lv", "lt", "mk", "mg", "ms",
        "ml", "mt", "mi", "mr", "mn", "my", "ne", "no", "fa", "pl", "pt",
        "pa", "ro", "ru", "sr", "st", "si", "sk", "sl", "so", "es", "su",
        "sw", "sv", "tg", "ta", "te", "th", "tr", "uk", "ur", "uz", "vi",
        "cy", "yi", "yo", "zu"}
    idiosyncrasies = {
        "zh-TW": "zh_Hant_TW",
        "zh-CN": "zh_Hans_CN",
        "jw": "jv",
        "iw": "he"
    }
    idiosyncrasies_reverse = {v: k for (k, v) in idiosyncrasies.items()}
    agents = {'User-Agent':"Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 1.1.4322; .NET CLR 2.0.50727; .NET CLR 3.0.04506.30)"}

    @classmethod
    def target_locales(cls):
        return (cls.asPosixLocale(loc) for loc in cls.known_locales)

    @classmethod
    def asKnownLocale(cls, locale_name):
        parts = locale_name.split("_")
        base = parts[0]
        if base in cls.known_locales:
            return base
        if base in cls.idiosyncrasies_reverse:
            return cls.idiosyncrasies_reverse[base]
        if base == "zh":
            p1 = parts[1]
            if p1 == "Hans":
                return "zh-CN"  # zh_Hans_CN
            elif p1 == "Hant":
                return "zh-TW"  # zh_Hant_TW
            elif p1 in ("CN", "TW"):
                return "_".join(parts[:1])

    @classmethod
    def asPosixLocale(cls, locale_name):
        return cls.idiosyncrasies.get(locale_name, locale_name)

    def get_mt_name(cls, source_name, target_name):
        return super(DummyGoogleTranslationService, cls).get_mt_name(
            cls.asKnownLocale(source_name), cls.asKnownLocale(target_name))

    @classmethod
    def canTranslate(cls, source, target):
        return (cls.asKnownLocale(source.locale) and
                cls.asKnownLocale(target.locale))

    def translate(self, text, target, source=None):
        # Initial implementation from https://github.com/mouuff/Google-Translate-API
        link = "http://translate.google.com/m?hl=%s&sl=%s&q=%s" % (
            self.asKnownLocale(target.locale),
            self.asKnownLocale(source.locale) if source else "",
            text.replace(" ", "+"))
        request = urllib2.Request(link, headers=self.agents)
        page = urllib2.urlopen(request).read()
        before_trans = 'class="t0">'
        result = page[page.find(before_trans)+len(before_trans):]
        result = result.split("<")[0]
        return result


class GoogleTranslationService(DummyGoogleTranslationService):
    known_locales = None

    def __init__(self, apikey=None):
        import apiclient.discovery
        # Look it up in config. TODO: Admin property of discussion
        apikey = config.get("google.server_api_key")
        self.client = apiclient.discovery.build(
            'translate', 'v2', developerKey=apikey)
        self.init_known_locales(self.client)

    @classmethod
    def init_known_locales(cls, client):
        if not cls.known_locales:
            r = client.languages().list().execute()
            cls.known_locales = [x[u'language'] for x in r[u'languages']]

    def identify(self, text, expected_locales=None):
        r = self.client.detections().list(q=text).execute()
        r = r[u"detections"][0]
        r.sort(lambda x: x[u"confidence"], reverse=True)
        return r[0][u"language"], {x[u'language']: x[u'confidence'] for x in r}

    def translate(self, text, target, source=None):
        r = self.client.translations().list(
            q=text, target=target, source=source).execute()
        return r[u"translations"][0][u'translatedText']
