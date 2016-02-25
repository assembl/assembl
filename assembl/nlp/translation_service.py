from abc import abstractmethod
import urllib2
from traceback import print_exc

import simplejson as json
from langdetect import detect_langs
from langdetect.detector import LangDetectException
from sqlalchemy import inspect

from assembl.lib.abc import (abstractclassmethod, classproperty)
from assembl.lib import config
from assembl.lib.enum import OrderedEnum
from assembl.models.langstrings import (
    Locale, LangString, LangStringEntry, LocaleLabel)


class LangStringStatus(OrderedEnum):
    SERVICE_DOWN = 1  # Transient, eg connection error
    TRANSLATION_FAILURE = 2  # possibly transient, like service down
    UNKNOWN_ERROR = 3  # unknown... assume transient
    PERMANENT_TRANSLATION_FAILURE = 10  # eg wrong arguments
    CANNOT_IDENTIFY = 11  # the identify failed permanently.
    CANNOT_TRANSLATE = 12   # as given by canTranslate, eg wrong target lang


class TranslationService(object):

    def __init__(self, discussion):
        self.discussion_id = discussion.id
        self._discussion = discussion

    # Should we identify before translating?
    distinct_identify_step = True

    @property
    def discussion(self):
        if inspect(self._discussion).detached:
            self._discussion = self._discussion.__class__.get(
                self.discussion_id)
        return self._discussion

    def canTranslate(self, source, target):
        return False

    def asKnownLocale(cls, locale_code):
        return locale_code

    def asPosixLocale(cls, locale_code):
        return locale_code

    @classmethod
    def can_guess_locale(cls, text):
        # empirical
        return len(text) >= 15

    def target_locales(self):
        return ()

    def target_locale_labels(self, target_locale):
        return LocaleLabel.names_of_locales_in_locale(
            list(self.target_locales()) + Locale.SPECIAL_LOCALES,
            target_locale)

    @staticmethod
    def set_error(lse, error_code, error_description):
        lid = lse.locale_identification_data_json
        lse.error_code = error_code.value
        lse.error_count = 1 + (lse.error_count or 0)
        if error_description:
            lid = lse.locale_identification_data_json
            lid['error_desc'] = error_description
            lse.locale_identification_data_json = lid

    def identify(self, text, constrain_to_discussion_locales=True):
        "Try to identify locale of text. Boost if one of the expected locales."
        if not text:
            return Locale.UNDEFINED, {Locale.UNDEFINED: 1}
        expected_locales = set((
            Locale.extract_root_locale(l)
            for l in self.discussion.discussion_locales))
        language_data = detect_langs(text)
        if constrain_to_discussion_locales:
            data = [(x.prob, x.lang)
                    for x in language_data
                    if Locale.extract_root_locale(x.lang) in expected_locales]
        else:
            # boost with discussion locales.
            data = [
                (x.prob * (
                    5 if Locale.Locale.extract_root_locale(x.lang)
                    in expected_locales else 1
                ), x.lang) for x in language_data]
        data.sort(reverse=True)
        top = data[0][1] if (data and (data[0][0] > 0.5)
                             ) else Locale.UNDEFINED
        return top, {lang: prob for (prob, lang) in data}

    def confirm_locale(self, langstring_entry, expected_locales=None):
        try:
            lang, data = self.identify(
                langstring_entry.value, expected_locales)
            data["service"] = self.__class__.__name__
            changed = langstring_entry.identify_locale(lang, data)
            if changed:
                langstring_entry.db.expire(langstring_entry, ["locale"])
                langstring_entry.db.expire(
                    langstring_entry.langstring, ["entries"])
            if lang == Locale.UNDEFINED:
                pass  # say you can't identify
        except Exception as e:
            print_exc()
            expected_locales = [
                Locale.extract_root_locale(l)
                for l in self.discussion.discussion_locales]
            self.set_error(langstring_entry, *self.decode_exception(e, True))

    @abstractmethod
    def translate(self, text, target, source=None, db=None):
        if not source or source == Locale.UNDEFINED:
            lang, data = self.identify(text)
            source = Locale.get_or_create(source, db)
        return text, lang

    def get_mt_name(self, source_name, target_name):
        return "%s-x-mtfrom-%s" % (target_name, source_name)

    def has_fatal_error(self, lse):
        return lse.error_code >= LangStringStatus.PERMANENT_TRANSLATION_FAILURE

    def decode_exception(self, e, identify_phase=False):
        if isinstance(e, LangDetectException):
            return LangStringStatus.CANNOT_IDENTIFY, str(e)
        return LangStringStatus.UNKNOWN_ERROR, str(e)

    def translate_lse(self, source_lse, target, retranslate=False):
        if source_lse.langstring_id == LangString.EMPTY_ID:
            # don't translate the empty string
            return source_lse
        source_locale = source_lse.locale_code
        if (source_locale == Locale.UNDEFINED
                and self.distinct_identify_step):
            self.confirm_locale(source_lse)
            # TODO: bail if identification failed
            source_locale = source_lse.locale_code
        target_lse = None
        is_new_lse = False
        if (source_locale != Locale.UNDEFINED
                or not self.distinct_identify_step
                or self.has_fatal_error(source_lse)):
            # We try to avoid ???-mt-from-und locales in the DB.
            # This is only stored if both identification and translation
            # failed to identify a language.
            mt_target_name = self.get_mt_name(source_locale, target.code)
            target_lse = source_lse.langstring.entries_as_dict.get(
                mt_target_name, None)
            if target_lse and not retranslate:
                if (not target_lse.error_count
                        or self.has_fatal_error(target_lse)):
                    return target_lse
        if target_lse is None:
            target_lse = LangStringEntry(
                langstring_id=source_lse.langstring_id,
                locale_id = Locale.UNDEFINED_LOCALEID,
                value='')
            is_new_lse = True
        if self.canTranslate(source_locale, target.code):
            try:
                trans, lang = self.translate(
                    source_lse.value,
                    target.code,
                    source_locale if source_locale != Locale.UNDEFINED
                    else None,
                    source_lse.db)
                lang = self.asPosixLocale(lang)
                # What if detected language is not a discussion language?
                if source_locale == Locale.UNDEFINED:
                    source_lse.identify_locale(lang, dict(
                        service=self.__class__.__name__))
                source_locale = source_lse.locale_code
                if Locale.len_common_parts(source_locale, target.code):
                    return source_lse
                target_lse.value = trans
                target_lse.error_count = 0
                target_lse.error_code = None
                target_lse.locale_identification_data_json = dict(
                    service=self.__class__.__name__)
            except Exception as e:
                print_exc()
                self.set_error(target_lse, *self.decode_exception(e))
                target_lse.value = ''
        else:
            # Note: when retranslating, we may lose a valid translation.
            if source_locale == Locale.UNDEFINED:
                if not self.distinct_identify_step:
                    # At least do this much.
                    self.confirm_locale(source_lse)
                    source_locale = source_lse.locale_code
            self.set_error(
                target_lse, LangStringStatus.CANNOT_TRANSLATE,
                "cannot translate")
            target_lse.value = ''
        if (not target_lse.locale or
                (source_locale != Locale.UNDEFINED
                 and Locale.extract_base_locale(
                    target_lse.locale_code) == Locale.UNDEFINED)):
            mt_target_name = self.get_mt_name(
                source_lse.locale_code, target.code)
            target_lse.locale = Locale.get_or_create(
                mt_target_name, source_lse.db)
        if is_new_lse:
            source_lse.db.add(target_lse)
        return target_lse


class DummyTranslationServiceTwoSteps(TranslationService):
    def canTranslate(cls, source, target):
        return True

    def translate(self, text, target, source=None, db=None):
        return u"Pseudo-translation from %s to %s of: %s" % (
            source or Locale.UNDEFINED, target, text), source

    def target_locale_labels(self, target_locale):
        return LocaleLabel.names_in_locale(target_locale)


class DummyTranslationServiceOneStep(DummyTranslationServiceTwoSteps):
    distinct_identify_step = False


class DummyTranslationServiceTwoStepsWithErrors(
        DummyTranslationServiceTwoSteps):
    def identify(self, text, constrain_to_discussion_locales=True):
        from random import random
        if random() > 0.9:
            raise RuntimeError()
        return super(DummyTranslationServiceTwoStepsWithErrors, self).identify(
            text, constrain_to_discussion_locales=True)

    def translate(self, text, target, source=None, db=None):
        from random import random
        if random() > 0.8:
            raise RuntimeError()
        return super(DummyTranslationServiceTwoStepsWithErrors, self
                     ).translate(text, target, source=source, db=db)


class DummyTranslationServiceOneStepWithErrors(DummyTranslationServiceOneStep):
    def translate(self, text, target, source=None, db=None):
        from random import random
        if random() > 0.8:
            raise RuntimeError()
        if source is None or source == Locale.UNDEFINED:
            source, _ = self.identify(text)
        return super(DummyTranslationServiceOneStepWithErrors, self).translate(
            text, target, source=source, db=db)


class DummyGoogleTranslationService(TranslationService):
    # Uses public Google API. For testing purposes. Do NOT use in production.
    _known_locales = {
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

    def target_locales(self):
        return (self.asPosixLocale(loc) for loc in self.known_locales)

    def asKnownLocale(self, locale_code):
        parts = locale_code.split("_")
        base = parts[0]
        if base in self.known_locales:
            return base
        if base in self.idiosyncrasies_reverse:
            return self.idiosyncrasies_reverse[base]
        if base == "zh":
            p1 = parts[1]
            if p1 == "Hans":
                return "zh-CN"  # zh_Hans_CN
            elif p1 == "Hant":
                return "zh-TW"  # zh_Hant_TW
            elif p1 in ("CN", "TW"):
                return "_".join(parts[:1])

    def asPosixLocale(cls, locale_code):
        return cls.idiosyncrasies.get(locale_code, locale_code)

    def get_mt_name(self, source_name, target_name):
        return super(DummyGoogleTranslationService, self).get_mt_name(
            self.asKnownLocale(source_name), self.asKnownLocale(target_name))

    def canTranslate(self, source, target):
        return ((source == Locale.UNDEFINED or
                 self.asKnownLocale(source)) and
                self.asKnownLocale(target))

    def translate(self, text, target, source=None, db=None):
        # Initial implementation from
        # https://github.com/mouuff/Google-Translate-API
        link = "http://translate.google.com/m?hl=%s&sl=%s&q=%s" % (
            self.asKnownLocale(target),
            self.asKnownLocale(source) if source else "",
            text.replace(" ", "+"))
        request = urllib2.Request(link, headers=self.agents)
        page = urllib2.urlopen(request).read()
        before_trans = 'class="t0">'
        result = page[page.find(before_trans)+len(before_trans):]
        result = result.split("<")[0]
        return result, source


class GoogleTranslationService(DummyGoogleTranslationService):
    _known_locales = None
    distinct_identify_step = False

    def __init__(self, discussion, apikey=None):
        super(GoogleTranslationService, self).__init__(discussion)
        import apiclient.discovery
        # Look it up in config. TODO: Admin property of discussion
        apikey = config.get("google.server_api_key")
        self.client = apiclient.discovery.build(
            'translate', 'v2', developerKey=apikey)

    @property
    def known_locales(self):
        if self._known_locales is None:
            try:
                r = self.client.languages().list().execute()
                if r[u'languages']:
                    self._known_locales = [x[u'language'] for x in r[u'languages']]
            except:
                return super(GoogleTranslationService, self)._known_locales
        return self._known_locales

    def identify(self, text, expected_locales=None):
        r = self.client.detections().list(q=text).execute()
        r = r[u"detections"][0]
        r.sort(lambda x: x[u"confidence"], reverse=True)
        # Not sure about how to interpret isReliable,
        # it seems to always be false.
        return self.asPosixLocale(r[0][u"language"]), {
            self.asPosixLocale(x[u'language']): x[u'confidence'] for x in r}

    def translate(self, text, target, source=None, db=None):
        r = self.client.translations().list(
            q=text, target=target, source=source).execute()
        if source is None:
            source = self.asPosixLocale(
                r[u"translations"][0][u'detectedSourceLanguage'])
        return r[u"translations"][0][u'translatedText'], source

    def decode_exception(self, exception, identify_phase=False):
        from googleapiclient.http import HttpError
        import socket
        if isinstance(exception, socket.error):
            return LangStringStatus.SERVICE_DOWN, str(exception)
        elif isinstance(exception, LangDetectException):
            return LangStringStatus.CANNOT_IDENTIFY, str(exception)
        elif isinstance(exception, HttpError):
            status = exception.resp.status
            content = json.loads(exception.content)
            if 400 <= status < 500:
                return (LangStringStatus.CANNOT_IDENTIFY
                        if identify_phase
                        else LangStringStatus.PERMANENT_TRANSLATION_FAILURE,
                        content)
            elif 500 <= status < 600:
                return LangStringStatus.TRANSLATION_FAILURE, content
                # make it permanent after awhile?
            return LangStringStatus.UNKNOWN_ERROR, content
        return LangStringStatus.UNKNOWN_ERROR, str(exception)
