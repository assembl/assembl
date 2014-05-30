from os.path import dirname, join
from collections import defaultdict
from Stemmer import Stemmer

languages = {
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

stopwordsdir = join(dirname(__file__), 'data', 'stopwords')


class StemSet(set):
    def __init__(self):
        super(StemSet, self).__init__()
        self.counter = 0

    def add(self, word):
        super(StemSet, self).add(word)
        self.counter += 1

    def shortest(self):
        all_words = list(self)
        all_words.sort(key=len)
        return all_words[0]


class WordCounter(defaultdict):
    def __init__(self, lang):
        super(WordCounter, self).__init__(StemSet)
        self.lang = languages[lang]
        self.stemmer = Stemmer(self.lang)
        self.stop_words = set(open(join(stopwordsdir, self.lang)).read().split())

    def add_text(self, text):
        for word in text.split():
            self.add_word(word)

    def add_word(self, word):
        if word.lower() in self.stop_words:
            return
        stemmed = self.stemmer.stemWord(word.lower())
        self[stemmed].add(word)

    def best(self, num=10):
        all_words = self.values()
        all_words.sort(key=lambda x: -x.counter)
        if len(all_words) > num:
            all_words = all_words[:num]
        return [x.shortest() for x in all_words]
