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

TEXT = {
    'index': True,
    'type': 'text',
}

_POST_MAPPING = {
    'creation_date': DATE,
    'id': KEYWORD,
    'body_fr': TEXT,
    'subject_fr': TEXT,
    'body_und': TEXT,
    'subject_und': TEXT,
    'body_en': TEXT,
    'subject_en': TEXT,
    'type': KEYWORD,
    'parent_id': KEYWORD,
    'creator_id': KEYWORD,
    'publishes_synthesis_id': KEYWORD,
    'url': KEYWORD,
}

MAPPINGS = {
    'post': _POST_MAPPING
}


def get_index_settings():
    return {'index_name': 'assembl',
            'chunk_size': 500,
            'index_settings': {'number_of_replicas': 0,
                               'number_of_shards': 1,
                              }
           }


def get_mapping(doc_type):
    """Return the mapping for a given doc type."""
    return MAPPINGS.get(doc_type, None)
