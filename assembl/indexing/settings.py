from copy import deepcopy

from . import index_languages

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


def add_index_languages(props, names):
    langs = index_languages()
    langs.add('other')
    for name in names:
        for lang in langs:
            props["_".join((name, lang))] = TEXT


COMMON_POST = {
    '_parent': {
        'type': 'user'
    },
    'properties': {
        'discussion_id': LONG,
        'creation_date': DATE,
        'id': LONG,
        'parent_id': {'type': 'long', 'null_value': 0},
        'creator_id': LONG,
        'parent_creator_id': LONG,
    #    'publishes_synthesis_id': KEYWORD,
        'type': KEYWORD,
        'sentiment_tags': KEYWORD
        # 'sentiment_counts'
    }
}

_POST_MAPPING = deepcopy(COMMON_POST)


_SYNTHESIS_MAPPING = deepcopy(COMMON_POST)
_SYNTHESIS_MAPPING['properties'].update({
    'subject': TEXT,
    'introduction': TEXT,
    'conclusion': TEXT,
})

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
    }
}

MAPPINGS = {
    'post': _POST_MAPPING,
    'synthesis': _SYNTHESIS_MAPPING,
    'user': _USER_MAPPING,
    'idea': _IDEA_MAPPING,
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
                                   }
                                 }
                               }
                             }
           }


def get_mapping(doc_type):
    """Return the mapping for a given doc type."""
    return MAPPINGS.get(doc_type, None)


def includeme(config):
    add_index_languages(_POST_MAPPING['properties'], ['body', 'subject'])
    add_index_languages(_SYNTHESIS_MAPPING['properties'], ['ideas'])
    add_index_languages(_IDEA_MAPPING['properties'], [
        'title', 'synthesis_title', 'description', 'announcement_title',
        'announcement_body'])
