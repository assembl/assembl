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
                body=mapping
            )


def delete_index(index_name):
    es = connect()
    return es.indices.delete(index_name, ignore=[400, 404])


def get_data(content):
    """Return uid, dict of fields we want to index,
    return None if we don't index."""
    from assembl.models import Idea, Post, SynthesisPost, AgentProfile
    if isinstance(content, Idea):
        data = {}
        for attr in ('creation_date', 'id', 'short_title', 'long_title',
                     'definition', 'discussion_id'):
            data[attr] = getattr(content, attr)

        if content.announcement:
            data['title'] = content.announcement.title
            data['body'] = content.announcement.body

        return get_uid(content), data

    elif isinstance(content, AgentProfile):
        data = {}
        for attr in ('creation_date', 'id', 'name'):
            data[attr] = getattr(content, attr, None)
            # AgentProfile doesn't have creation_date, User does.

        # get all discussions that the user is in via AgentStatusInDiscussion
        data['discussion_id'] = set([s.discussion_id
                                 for s in content.agent_status_in_discussion])
        # get discussion_id for all posts of this agent
        data['discussion_id'] = list(
            data['discussion_id'].union(
                [post.discussion_id for post in content.posts_created]
            )
        )
        return get_uid(content), data

    elif isinstance(content, Post):
        data = {}
        data['_parent'] = 'user:{}'.format(content.creator_id)
        for attr in ('discussion_id', 'creation_date', 'id', 'parent_id',
                     'creator_id', 'sentiment_counts'):
            data[attr] = getattr(content, attr)

        data['sentiment_tags'] = [key for key in data['sentiment_counts']
                                  if data['sentiment_counts'][key] > 0]
        data['sentiment_counts']['popularity'] = data['sentiment_counts']['like'] - data['sentiment_counts']['disagree']
        data['type'] = content.type  # this is the subtype (assembl_post, email...)
#        data['publishes_synthesis_id'] = getattr(
#            content, 'publishes_synthesis_id', None)
        if isinstance(content, SynthesisPost):
            data['subject'] = content.publishes_synthesis.subject
            data['introduction'] = content.publishes_synthesis.introduction
            data['conclusion'] = content.publishes_synthesis.conclusion
        else:
            for entry in content.body.entries:
                data['body_' + entry.locale_code] = entry.value

            for entry in content.subject.entries:
                data['subject_' + entry.locale_code] = entry.value

        return get_uid(content), data

    return None, None


def get_uid(content):
    """Return a global unique identifier"""
    from assembl.models import Idea, Post, SynthesisPost, AgentProfile
    if isinstance(content, Idea):
        doc_type = 'idea'
    elif isinstance(content, AgentProfile):
        doc_type = 'user'
    elif isinstance(content, Post):
        if isinstance(content, SynthesisPost):
            doc_type = 'synthesis'
        else:
            doc_type = 'post'

    return '{}:{}'.format(doc_type, content.id)


def get_doc_type_from_uid(uid):
    """Return doc_type from the uid."""
    return uid.split(':')[0]

