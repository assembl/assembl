import logging
from sqlalchemy.orm import with_polymorphic
from sqlalchemy.orm import joinedload

from assembl.lib import config
from assembl.indexing.changes import get_changes
from assembl.indexing.utils import delete_index, create_index_and_mapping
from assembl.indexing.settings import get_index_settings
from assembl.indexing import indexing_active


def reindex_in_elasticsearch(contents):
    changes = get_changes()
    for content in contents:
        changes.index_content(content)
        yield content


def intermediate_commit(contents):
    logger = logging.getLogger('assembl')
    count = 0
    changes = get_changes()
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
    from assembl.models import AgentProfile, Idea, Post
    from assembl.models.post import PublicationStates

    query = session.query(Idea
        ).filter(Idea.tombstone_condition()
        ).filter(Idea.hidden==False
        ).options(
            joinedload(Idea.title).joinedload("entries"),
            joinedload(Idea.synthesis_title).joinedload("entries"),
            joinedload(Idea.description).joinedload("entries")
        )

    for idea in query:
        yield idea

    query = session.query(AgentProfile)
    for user in query:
        yield user

    AllPost = with_polymorphic(Post, '*')
    query = session.query(AllPost
        ).filter(AllPost.tombstone_condition()
        ).filter(AllPost.hidden==False
        ).filter(AllPost.publication_state == PublicationStates.PUBLISHED
        ).options(
            joinedload(AllPost.subject).joinedload("entries"),
            joinedload(AllPost.body).joinedload("entries")
        )
    for post in query:
        for extract in post.extracts:
            yield extract

        yield post


def reindex_content(content, action='update'):
    """Index, reindex or unindex content. This function is called
    by the after_insert/update/delete sqlalchemy events.
    """
    from assembl.models.post import PublicationStates
    from assembl.models import (
        AgentStatusInDiscussion, Post, AgentProfile, Idea,
        IdeaContentLink, IdeaAnnouncement, SentimentOfPost, Extract)

    if not indexing_active():
        return

    indexed_contents = (Post, AgentProfile, Idea, Extract)
    changes = get_changes()
    if action == 'delete' and isinstance(content, indexed_contents):
        changes.unindex_content(content)
    elif isinstance(content, AgentProfile):
        changes.index_content(content)
    elif isinstance(content, AgentStatusInDiscussion):
        reindex_content(content.agent_profile)
    elif type(content) == Idea:  # only index Idea, not Thematic or Question
        if (not content.hidden and content.tombstone_date is None):
            changes.index_content(content)
        else:
            changes.unindex_content(content)
    elif isinstance(content, Post):
        if (content.publication_state == PublicationStates.PUBLISHED and
                not content.hidden and content.tombstone_date is None and
                not content.is_bright_mirror_fiction()):
            changes.index_content(content)
            for extract in content.extracts:
                changes.index_content(extract)
        else:
            changes.unindex_content(content)
            for extract in content.extracts:
                changes.unindex_content(extract)
    elif isinstance(content, Extract):
        # warning: should always be above isinstance(content, IdeaContentLink) block
        changes.index_content(content)
    elif isinstance(content, IdeaContentLink):
        # A AssemblPost is indexed before any IdeaRelatedPostLink is created,
        # so be sure to reindex content.content if we have a IdeaContentLink
        reindex_content(content.content)
    elif isinstance(content, IdeaAnnouncement):
        reindex_content(content.idea)
    elif isinstance(content, SentimentOfPost):
        reindex_content(content.post_from_sentiments)


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
        settings = get_index_settings(config)
        index_name = settings['index_name']
        delete_index(index_name)
        create_index_and_mapping(index_name)

    batch_reindex_elasticsearch(session)
