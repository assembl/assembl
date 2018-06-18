"""Abstract and concrete classes for a machine translation service."""
from abc import abstractmethod
import urllib2
from traceback import print_exc
import re
from collections import defaultdict
from math import log

import simplejson as json
from langdetect.detector_factory import init_factory
from langdetect.detector import LangDetectException
from sqlalchemy import inspect
from pyramid.i18n import TranslationStringFactory

from assembl.lib.abc import (abstractclassmethod, classproperty)
from assembl.lib import config
from assembl.lib.enum import OrderedEnum
from assembl.lib.clean_input import unescape
from assembl.models.langstrings import (
    Locale, LangString, LangStringEntry, LocaleLabel)
from assembl.lib.locale import strip_country


_ = TranslationStringFactory('assembl')

# Minimum length (chars) before we trust the language identifications outside
# discussion languages
SECURE_IDENTIFICATION_LIMIT = 250


class LangStringStatus(OrderedEnum):
    SERVICE_DOWN = 1  # Transient, eg connection error
    TRANSLATION_FAILURE = 2  # possibly transient, like service down
    UNKNOWN_ERROR = 3  # unknown... assume transient
    QUOTA_ERROR = 4 # quota exceeded
    PERMANENT_TRANSLATION_FAILURE = 10  # eg wrong arguments
    CANNOT_IDENTIFY = 11  # the identify failed permanently.
    CANNOT_TRANSLATE = 12   # as given by canTranslate, eg wrong target lang
    IDENTICAL_TRANSLATION = 13  # the translation is identical to the original?
    IDENTIFIED_TO_UNKNOWN = 14  # The identified language is not a discussion language
    TOO_MANY_TRANSIENTS = 15


class LanguageIdentificationService(object):
    canTranslate = None

    _url_regexp = re.compile(
        r"\b(https?|ftp)://(-\.)?([^\s/?\.#-]+\.?)+(/[^\s]*)?\b", re.I)

    def __init__(self, discussion):
        self.discussion_id = discussion.id
        self._discussion = discussion

    @property
    def discussion(self):
        if inspect(self._discussion).detached:
            self._discussion = self._discussion.__class__.get(
                self.discussion_id)
        return self._discussion

    @property
    def known_locales(cls):
        return cls.detector_factory().langlist

    def asKnownLocale(self, locale_code):
        # Google returns "zh-cn" or "zh-CN" when detecting Chinese and so
        # we have langstring entries with locale code set to "zh-cn" or "zh-CN".
        # We need to replace "-" by "_" for this code to work.
        parts = locale_code.replace("-", "_").split("_")
        base = parts[0]
        if base == "zh":
            if len(parts) > 1 and parts[1] in ("Hant", "TW", "HK", "SG", "MO"):
                return "zh-tw"
            return "zh-cn"  # mainland as default
        known_locales = self.detector_factory().langlist
        if base in self.known_locales:
            return base

    idiosyncrasies = {"zh-tw": "zh_Hant_TW", "zh-cn": "zh_Hans_CN"}

    @classmethod
    def asPosixLocale(cls, locale_code):
        return cls.idiosyncrasies.get(locale_code, locale_code)

    @classmethod
    def can_guess_locale(cls, text):
        # empirical
        return text and len(text) >= 15

    @classmethod
    def strlen_nourl(cls, data):
        # a fancy strlen that removes urls.
        return len(cls._url_regexp.sub(' ', data))

    def identify(
            self, text, expected_locales=None,
            constrain_locale_threshold=SECURE_IDENTIFICATION_LIMIT):
        "Try to identify locale of text. Boost if one of the expected locales."
        # Note that it is unreliable for very short text; especially it does not
        # give multiple probabilities when appropriate.
        if not text:
            return Locale.UNDEFINED, {Locale.UNDEFINED: 1}
        len_nourl = self.strlen_nourl(text)
        if len_nourl < 5:
            return Locale.NON_LINGUISTIC, {Locale.NON_LINGUISTIC: 1}
        detector = self.detector_factory().create()
        if constrain_locale_threshold and (
                len_nourl < constrain_locale_threshold):
            excluded_probability = 0
        else:
            # Give less probability to excluded languages for shorter texts
            excluded_probability = min(1, log(len_nourl) / 10)
        expected_locales = expected_locales or self.discussion.discussion_locales
        priors = self.convert_to_priors(expected_locales, excluded_probability)
        detector.set_prior_map(priors)
        detector.append(text)
        language_data = detector.get_probabilities()
        data = [(x.prob, x.lang) for x in language_data]
        data.sort(reverse=True)
        top = data[0][1] if (data and (data[0][0] > 0.5)
                             ) else Locale.UNDEFINED
        return top, {lang: prob for (prob, lang) in data}

    @staticmethod
    def detector_factory():
        init_factory()
        from langdetect.detector_factory import _factory as detector_factory
        return detector_factory

    def convert_to_priors(self, priors, base_rate=0.1):
        if isinstance(priors, list):
            priors = {self.asKnownLocale(l): 1 for l in priors}
        if base_rate > 0:
            factory = LanguageIdentificationService.detector_factory()
            if len(priors) < len(factory.langlist):
                priors0 = {l: base_rate for l in factory.langlist}
                priors0.update(priors)
                priors = priors0
        return priors

    def confirm_locale(
            self, langstring_entry, priors=None,
            constrain_locale_threshold=SECURE_IDENTIFICATION_LIMIT):
        try:
            expected_locales = priors or self.discussion.discussion_locales
            lang, data = self.identify(langstring_entry.value, expected_locales)
            data["service"] = self.__class__.__name__
            changed = langstring_entry.identify_locale(lang, data)
            if lang == Locale.UNDEFINED:
                pass  # say you can't identify
        except Exception as e:
            print_exc()
            self.set_error(langstring_entry, *self.decode_exception(e, True))

    @staticmethod
    def set_error(lse, error_code, error_description):
        lid = lse.locale_identification_data_json
        lse.error_code = error_code.value
        lse.error_count = 1 + (lse.error_count or 0)
        if (lse.error_count > 10 and
                lse.error_code < LangStringStatus.PERMANENT_TRANSLATION_FAILURE):
            lse.error_code = LangStringStatus.TOO_MANY_TRANSIENTS.value
        if error_description:
            lid = lse.locale_identification_data_json
            lid['error_desc'] = error_description
            lse.locale_identification_data_json = lid

    def has_fatal_error(self, lse):
        return lse.error_code >= LangStringStatus.PERMANENT_TRANSLATION_FAILURE

    @staticmethod
    def decode_exception(e, identify_phase=False):
        if isinstance(e, LangDetectException):
            return LangStringStatus.CANNOT_IDENTIFY, str(e)
        return LangStringStatus.UNKNOWN_ERROR, str(e)


class AbstractTranslationService(LanguageIdentificationService):
    # Should we identify before translating?
    distinct_identify_step = True

    def serviceData(self):
        return {"translation_notice": "Machine-translated",
                "idiosyncrasies": {}}

    def canTranslate(self, source, target):
        return False

    def target_locales(self):
        return ()

    @classmethod
    def target_locale_labels_for_locales(cls, locales, target_locale):
        return LocaleLabel.names_of_locales_in_locale(
            [strip_country(cls.asPosixLocale(loc)) for loc in locales] +
            Locale.SPECIAL_LOCALES,
            target_locale)

    def target_locale_labels(self, target_locale):
        return self.target_locale_labels_for_locales(
            list(self.target_locales()), target_locale)

    @abstractmethod
    def translate(self, text, target, is_html=False, source=None, db=None):
        if not text:
            return text, Locale.NON_LINGUISTIC
        if not source or source == Locale.UNDEFINED:
            lang, data = self.identify(text)
            source = Locale.get_or_create(source, db)
        return text, lang

    def get_mt_name(self, source_name, target_name):
        return Locale.create_mt_code(source_name, target_name)

    def translate_lse(
            self, source_lse, target, retranslate=False, is_html=False,
            constrain_locale_threshold=SECURE_IDENTIFICATION_LIMIT):
        if not source_lse.value:
            # don't translate empty strings
            return source_lse
        source_locale = source_lse.locale_code
        if source_locale == Locale.NON_LINGUISTIC:
            return source_lse
        # TODO: Handle MULTILINGUAL
        if (source_locale == Locale.UNDEFINED and
                self.strlen_nourl(source_lse.value) < 5):
            source_lse.identify_locale(Locale.NON_LINGUISTIC, None, True)
            return source_lse
        if (source_locale == Locale.UNDEFINED
                and self.distinct_identify_step):
            self.confirm_locale(
                source_lse,
                constrain_locale_threshold=constrain_locale_threshold)
            # TODO: bail if identification failed
            source_locale = source_lse.locale_code
        # TODO: Handle script differences
        if (Locale.compatible(source_locale, target.code)):
            return source_lse
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
                Locale.get_id_of(mt_target_name), None)
            if target_lse and not retranslate:
                if self.has_fatal_error(target_lse):
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
                    is_html,
                    source=source_locale if source_locale != Locale.UNDEFINED
                    else None,
                    db=source_lse.db)
                lang = self.asPosixLocale(lang)
                # What if detected language is not a discussion language?
                if source_locale == Locale.UNDEFINED:
                    if constrain_locale_threshold and (
                            self.strlen_nourl(source_lse.value) <
                            constrain_locale_threshold):
                        if (not lang) or not Locale.any_compatible(
                                lang, self.discussion.discussion_locales):
                            self.set_error(
                                source_lse,
                                LangStringStatus.IDENTIFIED_TO_UNKNOWN,
                                "Identified to "+lang)
                            return source_lse
                    source_lse.identify_locale(lang, dict(
                        service=self.__class__.__name__))
                    # This should never actually happen, because
                    # it would mean that the language id. was forgotten.
                    # Still, to be sure that all cases are covered.
                    mt_target_name = self.get_mt_name(lang, target.code)
                    other_target_lse = source_lse.langstring.entries_as_dict.get(
                        Locale.get_id_of(mt_target_name), None)
                    if other_target_lse:
                        target_lse = other_target_lse
                        is_new_lse = False
                source_locale = source_lse.locale_code
                if Locale.compatible(source_locale, target.code):
                    return source_lse
                target_lse.value = trans
                target_lse.error_count = 0
                target_lse.error_code = None
                target_lse.locale_identification_data_json = dict(
                    service=self.__class__.__name__)
                if trans.strip() == source_lse.value.strip():
                    # TODO: Check modulo spaces in the middle
                    target_lse.error_count = 1
                    target_lse.error_code = \
                        LangStringStatus.IDENTICAL_TRANSLATION.value
            except Exception as e:
                print_exc()
                self.set_error(target_lse, *self.decode_exception(e))
                target_lse.value = None
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
            target_lse.value = None
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


class DummyTranslationServiceTwoSteps(AbstractTranslationService):
    def canTranslate(cls, source, target):
        return True

    def translate(self, text, target, is_html=False, source=None, db=None):
        if not text:
            return text, Locale.NON_LINGUISTIC
        if not source:
            source, _ = self.identify(text)
        return u"Pseudo-translation from %s to %s of: %s" % (
            source or Locale.UNDEFINED, target, text), source

    def target_locale_labels(self, target_locale):
        return LocaleLabel.names_in_locale(target_locale)


class DummyTranslationServiceOneStep(DummyTranslationServiceTwoSteps):
    distinct_identify_step = False


class DummyTranslationServiceTwoStepsWithErrors(
        DummyTranslationServiceTwoSteps):
    def identify(
            self, text, expected_locales=None,
            constrain_locale_threshold=SECURE_IDENTIFICATION_LIMIT):
        from random import random
        if random() > 0.9:
            raise RuntimeError()
        return super(DummyTranslationServiceTwoStepsWithErrors, self).identify(
            text, expected_locales, constrain_locale_threshold)

    def translate(self, text, target, is_html=False, source=None, db=None):
        if not text:
            return text, Locale.NON_LINGUISTIC
        from random import random
        if random() > 0.8:
            raise RuntimeError()
        return super(DummyTranslationServiceTwoStepsWithErrors, self
                     ).translate(text, target, is_html, source=source, db=db)


class DummyTranslationServiceOneStepWithErrors(DummyTranslationServiceOneStep):
    def translate(self, text, target, is_html=False, source=None, db=None):
        if not text:
            return text, Locale.NON_LINGUISTIC
        from random import random
        if random() > 0.8:
            raise RuntimeError()
        if source is None or source == Locale.UNDEFINED:
            source, _ = self.identify(text)
        return super(DummyTranslationServiceOneStepWithErrors, self).translate(
            text, target, is_html, source=source, db=db)


class DummyGoogleTranslationService(AbstractTranslationService):
    # Uses public Google API. For testing purposes. Do NOT use in production.
    _known_locales = {
        'af', 'am', 'ar', 'az', 'be', 'bg', 'bn', 'bs', 'ca', 'ceb', 'co',
        'cs', 'cy', 'da', 'de', 'el', 'en', 'eo', 'es', 'et', 'eu', 'fa',
        'fi', 'fr', 'fy', 'ga', 'gd', 'gl', 'gu', 'ha', 'haw', 'iw', 'hi',
        'hmn', 'hr', 'ht', 'hu', 'hy', 'id', 'ig', 'is', 'it', 'ja', 'jw',
        'ka', 'kk', 'km', 'kn', 'ko', 'ku', 'ky', 'la', 'lb', 'lo', 'lt',
        'lv', 'mg', 'mi', 'mk', 'ml', 'mn', 'mr', 'ms', 'mt', 'my', 'ne',
        'nl', 'no', 'ny', 'pa', 'pl', 'ps', 'pt', 'ro', 'ru', 'sd', 'si',
        'sk', 'sl', 'sm', 'sn', 'so', 'sq', 'sr', 'st', 'su', 'sv', 'sw',
        'ta', 'te', 'tg', 'th', 'tl', 'tr', 'uk', 'ur', 'uz', 'vi', 'xh',
        'yi', 'yo', 'zh', 'zh-TW', 'zu'}
    known_locales_cls = _known_locales
    known_locales = known_locales_cls
    idiosyncrasies = {
         "zh-TW": "zh_Hant_TW",
         "zh": "zh_Hans_CN",
         "jw": "jv",
         "iw": "he"
    }
    idiosyncrasies_reverse = {v: k for (k, v) in idiosyncrasies.items()}
    agents = {'User-Agent':"Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 1.1.4322; .NET CLR 2.0.50727; .NET CLR 3.0.04506.30)"}

    @classmethod
    def target_localesC(cls):
        return (cls.asPosixLocale(loc) for loc in cls.known_locales)

    def target_locales(self):
        return self.target_localesC()

    @classmethod
    def target_locale_labels_cls(cls, target_locale):
        return cls.target_locale_labels_for_locales(
            cls.target_localesC(), target_locale)

    def serviceData(self):
        return {"translation_notice": _("Translated by Google Translate"),
                "translation_notice_url": "http://translate.google.com",
                "idiosyncrasies": self.idiosyncrasies_reverse}

    def asKnownLocale(self, locale_code):
        parts = locale_code.replace("-", "_").split("_")
        base = parts[0]
        if base == "zh" and len(parts) > 1:
            p1 = parts[1]
            if p1 in ("Hans", "CN"):
                return "zh"  # zh_Hans_CN
            elif p1 in ("Hant", "TW", "HK", "SG", "MO"):
                return "zh-TW"
            else:
                return base
        if base in self.known_locales:
            return base
        if base in self.idiosyncrasies_reverse:
            return self.idiosyncrasies_reverse[base]

    def get_mt_name(self, source_name, target_name):
        return super(DummyGoogleTranslationService, self).get_mt_name(
            self.asPosixLocale(source_name), self.asPosixLocale(target_name))

    def canTranslate(self, source, target):
        return ((source == Locale.UNDEFINED or
                 self.asKnownLocale(source)) and
                self.asKnownLocale(target))

    def translate(self, text, target, is_html=False, source=None, db=None):
        if not text:
            return text, Locale.NON_LINGUISTIC
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
    distinct_identify_step = False

    def __init__(self, discussion, apikey=None):
        super(GoogleTranslationService, self).__init__(discussion)
        import apiclient.discovery
        # Look it up in config. TODO: Admin property of discussion
        apikey = config.get("google.server_api_key")
        self._known_locales = None
        self.client = apiclient.discovery.build(
            'translate', 'v2', developerKey=apikey) if apikey else None

    @staticmethod
    def unescape_text(text):
        return unescape(text)

    @staticmethod
    def unescape_html(text):
        # TODO: copy HTMLEntities.unescape but leaving
        # &, <, > alone. Just leave it unchanged for now.
        return text

    @staticmethod
    def unescape_string(text, is_html):
        if is_html:
            return GoogleTranslationService.unescape_html(text)
        else:
            return GoogleTranslationService.unescape_text(text)

    @property
    def known_locales(self):
        if not self.client:
            return self.known_locales_cls
        if self._known_locales is None:
            try:
                r = self.client.languages().list().execute()
                if r[u'languages']:
                    self._known_locales = [
                        x[u'language'] for x in r[u'languages']]
                    if set(self._known_locales) != set(
                            DummyGoogleTranslationService._known_locales):
                        from ..lib.raven_client import capture_message
                        capture_message("google changed its language set again")
            except:
                return self.known_locales_cls
        return self._known_locales

    def identify(
            self, text, expected_locales=None,
            constrain_locale_threshold=SECURE_IDENTIFICATION_LIMIT):
        if not text:
            return Locale.UNDEFINED, {Locale.UNDEFINED: 1}
        if not self.client or self.strlen_nourl(text) >= SECURE_IDENTIFICATION_LIMIT:
            # Save money by avoiding the identification step when the text is long enough.
            return super(GoogleTranslationService, self).identify(
                text, expected_locales, constrain_locale_threshold)
        r = self.client.detections().list(q=text).execute()
        r = r[u"detections"][0]
        # small correction for expected languages, as this service is deemed reliable.
        priors = self.convert_to_priors(expected_locales, 0.8)
        r.sort(lambda x: x[u"confidence"] * priors.get(x[u'language'], 0.8), reverse=True)
        # Not sure about how to interpret isReliable,
        # it seems to always be false.
        return self.asPosixLocale(r[0][u"language"]), {
            self.asPosixLocale(x[u'language']): x[u'confidence'] for x in r}

    def translate(self, text, target, is_html=False, source=None, db=None):
        if not text:
            return text, Locale.NON_LINGUISTIC
        if not self.client:
            from googleapiclient.http import HttpError
            raise HttpError(401, '{"error":"Please define server_api_key"}')
        r = self.client.translations().list(
            q=text,
            format="html" if is_html else "text",
            target=self.asKnownLocale(target),
            source=self.asKnownLocale(source) if source else None).execute()
        if source is None:
            source = self.asPosixLocale(
                r[u"translations"][0][u'detectedSourceLanguage'])
        translated = r[u"translations"][0][u'translatedText']
        # Google uses unnecessary entities in translation
        translated = self.unescape_string(translated, is_html)
        return translated, source

    def decode_exception(self, exception, identify_phase=False):
        from googleapiclient.http import HttpError
        import socket
        if isinstance(exception, socket.error):
            return LangStringStatus.SERVICE_DOWN, str(exception)
        elif isinstance(exception, HttpError):
            status = exception.resp
            try:
                status = getattr(status, "status")
            except:
                pass
            content = json.loads(exception.content)
            if status == 403:
                return (LangStringStatus.QUOTA_ERROR, content)
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
