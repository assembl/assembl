# -*- coding: utf-8 -*-
from ..lib.config import get as _get
from copy import deepcopy


def index_languages():
    "Languages which have their own indexes"
    return set(_get('elasticsearch_lang_indexes', 'en fr').split())


BOOL = {
    'index': True,
    'type': 'boolean',
}

DATE = {
    'index': True,
    'type': 'date',
}

KEYWORD = {
    'index': True,
    'type': 'keyword'
}

LONG = {
    'index': True,
    'type': 'long',
}

TEXT = {
    'index': True,
    'type': 'text',
}


# Don't use default language analyzer, it doesn't have the html_strip filter
known_analyzers = {
#    'ar': "arabic",
#    'hy': "armenian",
#    'eu': "basque",
#    'bg': "bulgarian",
#    'ca': "catalan",
#    'cs': "czech",
#    'nl': "dutch",
#    'en': "english",
#    'fi': "finnish",
#    'fr': "french",
#    'gl': "galician",
#    'de': "german",
#    'hi': "hindi",
#    'hu': "hungarian",
#    'id': "indonesian",
#    'ga': "irish",
#    'it': "italian",
#    'lv': "latvian",
#    'lt': "lithuanian",
#    'no': "norwegian",
#    'pt': "portuguese",
#    'ro': "romanian",
#    'ru': "russian",
#    'ku': "sorani",
#    'es': "spanish",
#    'sv': "swedish",
#    'tr': "turkish",
    'ja': "japanese",
    'zh_CN': "chinese",
}

# You can test the search like this:
# curl 'http://localhost:9200/assembl/_search?pretty' --data-binary '{"query": {"bool": {"must": [{"match": {"body_fr": "Nourbakhsh" }}]}}}'
# curl 'http://localhost:9200/assembl/_search?pretty' --data-binary '{"query": {"bool": {"must": [{"match": {"body_ja": "プラットフォーム" }}]}}}'
# To test an analyzer:
# curl 'http://localhost:9200/assembl/_analyze?pretty' --data-binary '{"analyzer": "japanese", "text": "この集合知のプラットフォームを用いて主要なアイデア や提案を統合することで、人工知能の国際的なガバナンスのための解決策と実行可能な政策ツールを提供します。"}'
# To verify the mapping:
# curl http://localhost:9200/assembl/_mapping?pretty


def add_index_languages(props, names):
    langs = index_languages()
    langs.add('other')
    for name in names:
        for lang in langs:
            analyzer = known_analyzers.get(lang, 'default')
            props["_".join((name, lang))] = {
                'analyzer': analyzer,
                'index': True,
                'type': 'text',
            }


COMMON_POST = {
    '_parent': {
        'type': 'user'
    },
    'properties': {
        'discussion_id': LONG,
        'creation_date': DATE,
        'id': LONG,
        'parent_id': {'type': 'long', 'null_value': 0},
        'idea_id': LONG,
        'creator_id': LONG,
        'creator_display_name': TEXT,
        'parent_creator_id': LONG,
    #    'publishes_synthesis_id': KEYWORD,
        'type': KEYWORD,
        'phase_identifier': KEYWORD,
        'phase_id': KEYWORD,
        'sentiment_tags': KEYWORD
        # 'sentiment_counts'
    }
}

_POST_MAPPING = deepcopy(COMMON_POST)


_SYNTHESIS_MAPPING = deepcopy(COMMON_POST)

_USER_MAPPING = {
    'properties': {
        'discussion_id': LONG,
        'creation_date': DATE,
        'id': LONG,
        'name': TEXT,
    }
}

_IDEA_MAPPING = {
    'properties': {
        'discussion_id': LONG,
        'creation_date': DATE,
        'id': LONG,
        'phase_identifier': KEYWORD,
        'phase_id': KEYWORD,
    }
}

_EXTRACT_MAPPING = {
    'properties': {
        'discussion_id': LONG,
        'creation_date': DATE,
        'id': LONG,
        'post_id': LONG,
        'creator_id': LONG,
        'idea_id': LONG,
        'phase_identifier': KEYWORD,
        'phase_id': KEYWORD,
        'body': TEXT,
        'extract_nature': KEYWORD,
        'extract_action': KEYWORD,
        'extract_state': KEYWORD
    }
}

MAPPINGS = {
    'post': _POST_MAPPING,
    'synthesis': _SYNTHESIS_MAPPING,
    'user': _USER_MAPPING,
    'idea': _IDEA_MAPPING,
    'extract': _EXTRACT_MAPPING
}


def get_index_settings(config):
    return {"index_name": config.get('elasticsearch_index', 'assembl'),
            "chunk_size": 500,
            "index_settings": {"number_of_replicas": 0,
                               "number_of_shards": 1,
                               "analysis": {
                                 "char_filter": {
                                    "replace": {
                                     "type": "mapping",
                                     "mappings": [
                                       "&=> and "
                                     ]
                                   }
                                 },
                                 "filter": {
                                   "word_delimiter" : {
                                     "type": "word_delimiter",
                                     "split_on_numerics": False,
                                     "split_on_case_change": True,
                                     "generate_word_parts": True,
                                     "generate_number_parts": True,
                                     "catenate_all": True,
                                     "preserve_original": True,
                                     "catenate_numbers": True
                                   }
                                 },
                                 "analyzer": {
                                   "default": {
                                     "type": "custom",
                                     "char_filter": [
                                       "html_strip",
                                       "replace"
                                     ],
                                     "tokenizer": "whitespace",
                                     "filter": [
                                         "lowercase",
                                         "word_delimiter"
                                     ]
                                   },
                                   "japanese": {
                                     "type": "custom",
                                     "char_filter": [
                                       "html_strip",
                                     ],
                                     "tokenizer": "kuromoji_tokenizer",
                                   },
                                   "chinese": {
                                     "type": "custom",
                                     "char_filter": [
                                       "html_strip",
                                     ],
                                     "tokenizer": "smartcn_tokenizer",
                                   }
                                 }
                               }
                             }
           }


def get_mapping(doc_type):
    """Return the mapping for a given doc type."""
    return MAPPINGS.get(doc_type, None)


def includeme(config):
    add_index_languages(_EXTRACT_MAPPING['properties'], ['subject'])
    add_index_languages(_POST_MAPPING['properties'], ['body', 'subject'])
    add_index_languages(_SYNTHESIS_MAPPING['properties'], ['subject', 'introduction', 'conclusion', 'ideas'])
    add_index_languages(_IDEA_MAPPING['properties'], [
        'title', 'synthesis_title', 'description', 'announcement_title',
        'announcement_body'])
