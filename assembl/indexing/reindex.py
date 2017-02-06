import logging
from sqlalchemy.orm import with_polymorphic

from assembl.indexing.changes import changes
from assembl.indexing.utils import delete_index, create_index_and_mapping
from assembl.indexing.settings import get_index_settings


def reindex_in_elasticsearch(contents):
    for content in contents:
        changes.index_content(content)
        yield content


def intermediate_commit(contents):
    logger = logging.getLogger('assembl')
    count = 0
    for content in contents:
        count += 1
        if count % 100 == 0:
            logger.info('{0} items read'.format(count))
        if count % 500 == 0:
            #transaction.commit()
            changes.tpc_finish(None)
            logger.info('{0} items indexed'.format(count))
        yield content

    #we can't do a real commit, we got DetachedInstanceError
    #transaction.commit()
    changes.tpc_finish(None)
    logger.info('{0} items indexed'.format(count))


def get_indexable_contents(session):
    from assembl.models import Post # TODO Synthesis, Idea, IdeaAnnouncement
    from assembl.models.post import PublicationStates
    AllPost = with_polymorphic(Post, '*')
    query = session.query(AllPost
        ).filter(AllPost.tombstone_condition()
        ).filter(AllPost.hidden==False
        ).filter(AllPost.publication_state == PublicationStates.PUBLISHED)
    for post in query:
        yield post


def batch_reindex_elasticsearch(session):
    for content in intermediate_commit(
            reindex_in_elasticsearch(
                get_indexable_contents(session)
            )
        ):
        # consume generator
        pass


def reindex_all_contents(session, delete=True):
    if delete:
        settings = get_index_settings()
        index_name = settings['index_name']
        delete_index(index_name)
        create_index_and_mapping(index_name)

    batch_reindex_elasticsearch(session)
