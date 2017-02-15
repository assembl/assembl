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

COMMON_POST = {
    'discussion_id': LONG,
    'creation_date': DATE,
    'id': LONG,
    'parent_id': LONG,
    'creator_id': LONG,
#    'publishes_synthesis_id': KEYWORD,
    'type': KEYWORD,
}

_POST_MAPPING = COMMON_POST.copy()
_POST_MAPPING.update({
    'body_fr': TEXT,
    'subject_fr': TEXT,
    'body_und': TEXT,
    'subject_und': TEXT,
    'body_en': TEXT,
    'subject_en': TEXT,
})

_SYNTHESIS_MAPPING = COMMON_POST.copy()
_SYNTHESIS_MAPPING.update({
    'subject': TEXT,
    'introduction': TEXT,
    'conclusion': TEXT,
})

_USER_MAPPING = {
    'discussion_id': LONG,
    'creation_date': DATE,
    'id': LONG,
    'name': TEXT,
}

_IDEA_MAPPING = {
    'discussion_id': LONG,
    'creation_date': DATE,
    'id': LONG,
    'short_title': TEXT,
    'long_title': TEXT,
    'definition': TEXT,
    'title': TEXT,  # announce
    'body': TEXT,  # announce
}

MAPPINGS = {
    'post': _POST_MAPPING,
    'synthesis': _SYNTHESIS_MAPPING,
    'user': _USER_MAPPING,
    'idea': _IDEA_MAPPING,
}


def get_index_settings():
    return {"index_name": 'assembl',
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
