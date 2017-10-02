from ..lib.config import get as _get
from pyramid.settings import asbool as _asbool


def indexing_active():
    return _asbool(_get('use_elasticsearch'))


def index_languages():
    "Languages which have their own indexes"
    return set(_get('elasticsearch_lang_indexes', 'en fr').split())


def includeme(config):
    """ Initialize changes. """
    if indexing_active():
        config.include('.changes')
        config.include('.settings')
