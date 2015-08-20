from os.path import dirname, join

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
    if lang not in _stopwords:
        _stopwords['lang'] = set(open(join(
            stopwordsdir, lang)).read().split())
    return _stopwords['lang']


def normalize_locale(lang):
    if '_' in lang:
        lang = lang.split('_', 1)[0]
    if len(lang) == 2:
        lang = languages_by_iso2.get(lang, lang)
    elif len(lang) == 3:
        lang = languages_by_iso3.get(lang, lang)
    return lang


class DummyStemmer(object):
    def stemWord(self, word):
        return word

    def stemText(self, text):
        return text
