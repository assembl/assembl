import os

from elasticsearch.client import Elasticsearch

from assembl.indexing.settings import get_index_settings, MAPPINGS

_es = None


def connect():
    global _es
    if _es is None:
        server = os.getenv('ELASTICSEARCH_PORT', '127.0.0.1:9200')
        _es = Elasticsearch(server)
    return _es


def create_index(index_name):
    """Create the index and return connection.
    """
    es = connect()
    settings = get_index_settings()['index_settings']
    exists = es.indices.exists(index_name)
    if not exists:
        es.indices.create(index=index_name, body={'settings': settings})

    return es


def create_index_and_mapping(index_name):
    """Create the index, put mapping for each doc types.
    """
    es = create_index(index_name)
    for doc_type, mapping in MAPPINGS.items():
        es.indices.put_mapping(
                index=index_name,
                doc_type=doc_type,
                body={"properties": mapping}
            )


def delete_index(index_name):
    es = connect()
    return es.indices.delete(index_name, ignore=[400, 404])


def get_data(content):
    """Return uid, dict of fields we want to index,
    return None if we don't index."""
    from assembl.models import Post
    if isinstance(content, Post):
        # TODO index the can_use...
        data = {}
        data['doc_type'] = 'post'
        data['url'] = content.get_url()
        for attr in ('discussion_id', 'creation_date', 'id', 'type', 'parent_id',
                     'creator_id'):
            data[attr] = getattr(content, attr)

        data['publishes_synthesis_id'] = getattr(
            content, 'publishes_synthesis_id', False)

        for entry in content.body.entries:
            data['body_' + entry.locale.code] = entry.value

        for entry in content.subject.entries:
            data['subject_' + entry.locale.code] = entry.value

        return get_uid(content), data

    return None, None


def get_uid(content):
    """Return a global unique identifier"""
    return '{}:{}'.format(content.external_typename(), content.id)


def get_doc_type_from_uid(uid):
    """Return doc_type from the uid."""
    return uid.split(':')[0]

