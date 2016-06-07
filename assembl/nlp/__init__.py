"""Natural language processing utilities"""
from os.path import dirname, join, exists
import pickle

from Stemmer import Stemmer

known_languages = {
    'danish',
    'dutch',
    'english',
    'finnish',
    'french',
    'german',
    'hungarian',
    'italian',
    'norwegian',
    'portuguese',
    'romanian',
    'russian',
    'spanish',
    'swedish',
    'turkish'
}

languages_by_iso2 = {
    'da': 'danish',
    'de': 'german',
    'en': 'english',
    'es': 'spanish',
    'fi': 'finnish',
    'fr': 'french',
    'hu': 'hungarian',
    'it': 'italian',
    'nl': 'dutch',
    'no': 'norwegian',
    'pt': 'portuguese',
    'ro': 'romanian',
    'ru': 'russian',
    'sv': 'swedish',
    'tr': 'turkish'
}

languages_by_iso3 = {
    'dan': 'danish',
    'deu': 'german',
    'dut': 'dutch',
    'eng': 'english',
    'fin': 'finnish',
    'fra': 'french',
    'fre': 'french',
    'hun': 'hungarian',
    'ita': 'italian',
    'nld': 'dutch',
    'nor': 'norwegian',
    'por': 'portuguese',
    'ron': 'romanian',
    'rum': 'romanian',
    'rus': 'russian',
    'spa': 'spanish',
    'swe': 'swedish',
    'tur': 'turkish'
}

stopwordsdir = join(dirname(__file__), 'data', 'stopwords')

_stopwords = {}


def get_stop_words(lang):
    global _stopwords
    lang = locale_to_lang(lang)
    if lang not in _stopwords:
        fname = join(stopwordsdir, lang)
        if exists(fname):
            _stopwords['lang'] = set(open(fname).read().split())
        else:
            return set()
    return _stopwords['lang']


def locale_to_lang(locale):
    if '_' in locale:
        locale = locale.split('_', 1)[0]
    if len(locale) == 2:
        locale = languages_by_iso2.get(locale, locale)
    elif len(locale) == 3:
        locale = languages_by_iso3.get(locale, locale)
    return locale


class DummyStemmer(object):
    def stemWord(self, word):
        return word

    def stemWords(self, words):
        return words


class ReversibleStemmer(object):
    def __init__(self, stemmer, fname):
        self.stemmer = stemmer
        self.reverse = {}
        self.fname = fname
        self.load()

    def load(self):
        if not exists(self.fname):
            return
        try:
            with open(self.fname) as f:
                ob = pickle.load(f)
                if isinstance(ob, dict):
                    self.reverse = ob
        except Exception:
            pass

    def save(self):
        with open(self.fname, 'w') as f:
            pickle.dump(self.reverse, f)

    def stemWord(self, word):
        stemmed = self.stemmer.stemWord(word)
        orig = self.reverse.get(stemmed, None)
        if orig is None or len(orig) > len(word):
            self.reverse[stemmed] = word
        return stemmed

    def stemText(self, text):
        return text

    def stemWords(self, words):
        result = []
        for word in words:
            result.append(self.stemWord(word))
        return result


_stemmers = {
    None: DummyStemmer()
}


def get_stemmer(lang, allow_dummy=True):
    global _stemmers
    if lang:
        lang = locale_to_lang(lang)
    if lang not in known_languages:
        if not allow_dummy:
            return None
        _stemmers[lang] = DummyStemmer()
    elif lang not in _stemmers:
        _stemmers[lang] = Stemmer(lang)
    return _stemmers[lang]
