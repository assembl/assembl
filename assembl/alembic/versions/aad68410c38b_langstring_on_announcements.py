"""langstring on announcements

Revision ID: aad68410c38b
Revises: d0fa685ff549
Create Date: 2017-09-29 15:53:21.121154

"""

# revision identifiers, used by Alembic.
revision = 'aad68410c38b'
down_revision = 'd0fa685ff549'

from alembic import context, op
import sqlalchemy as sa
import transaction
from sqlalchemy.orm import (joinedload, subqueryload)


from assembl.lib import config
from assembl.lib.clean_input import sanitize_text


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('announce', sa.Column('title_id',
                      sa.Integer(), sa.ForeignKey('langstring.id')))
        op.add_column('announce', sa.Column('body_id',
                      sa.Integer(), sa.ForeignKey('langstring.id')))

    # Do stuff with the app's models here.
    from assembl import models as m
    from assembl.nlp.translation_service import LanguageIdentificationService
    db = m.get_session_maker()()

    # Disable idea reindexation
    from assembl.lib.sqla import BaseOps, orm_update_listener
    if sa.event.contains(BaseOps, 'after_update', orm_update_listener):
        sa.event.remove(BaseOps, 'after_update', orm_update_listener)

    with transaction.manager:
        ds = db.query(m.Discussion).all()
        locales_of_discussion = {d.id: d.discussion_locales for d in ds}
        langid_services = {d.id: LanguageIdentificationService(d) for d in ds
                           if len(locales_of_discussion[d.id]) > 1}

        announcement_strings = db.execute(
            "SELECT id, title, body FROM announce")
        announcement_strings = {id: (title, body)
            for (id, title, body) in announcement_strings}

        for announcement in db.query(m.Announcement):
            candidate_langs = locales_of_discussion[announcement.discussion_id]
            (title, body) = announcement_strings[announcement.id]
            if len(candidate_langs) == 1:
                lang = candidate_langs[0]
            else:
                text = ' '.join(filter(None, (
                    title or '',
                    sanitize_text(body or ''))))
                lang = None
                if text:
                    # Use idea language for priors?
                    lang, data = langid_services[announcement.discussion_id].identify(text)
                if not lang:
                    print "***** Could not identify for announcement %d: %s" % (announcement.id, text)
                    lang = candidate_langs[0]

            def as_lang_string(text):
                ls = m.LangString.create(text, lang)
                return ls

            if title:
                announcement.title = as_lang_string(title)
            if body:
                announcement.body = as_lang_string(body)

    with context.begin_transaction():
        op.drop_column('announce', 'title')
        op.drop_column('announce', 'body')

def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
