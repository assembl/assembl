# -*- coding=utf-8 -*-
"""Fix subjects of posts that have been created in a multicolumn
by using the original locale of the thematic.
"""
import logging
import logging.config
import pdb
import sys
import traceback
import transaction

from pyramid.paster import bootstrap

from assembl.lib.sqla import get_session_maker


def fix_posts_subjects(db, logger):
    from assembl.models import AssemblPost, Idea, LangString
    count = 0
    with transaction.manager:
        for idea in db.query(Idea).filter(Idea.message_view_override == 'messageColumns'):
            for post in idea.get_related_posts_query():
                locale = post.body.first_original().locale.code
                new_post_subject = LangString.create(u'', locale)
                if idea.title:
                    closest_subject_entry = idea.title.closest_entry(locale)
                    if closest_subject_entry:
                        new_post_subject = LangString.create(closest_subject_entry.value, locale)

                logger.info(u'Old subject: %s', post.subject)
                logger.info(u'New subject: %s', new_post_subject)
                post.subject = new_post_subject
                count += 1

    return count


def get_logger():
    logger = logging.getLogger('fix_posts_subjects')
    fh = logging.FileHandler('/tmp/fix_posts_subjects.log', 'w')
    fh.setLevel(logging.INFO)
    formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
    fh.setFormatter(formatter)
    logger.addHandler(fh)
    return logger


if __name__ == '__main__':
    config_fname = sys.argv[1]
    env = bootstrap(config_fname)
    logging.config.fileConfig(config_fname)
    session = get_session_maker()()
    logger = get_logger()
    try:
        count = fix_posts_subjects(session, logger)
        logger.info(u'%s subjects have been fixed with success', count)
    except Exception as e:
        traceback.print_exc()
        pdb.post_mortem()

    env['closer']()
