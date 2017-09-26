"""langstring on ideas

Revision ID: d0fa685ff549
Revises: 5dc0a7b57c0f
Create Date: 2017-09-25 13:10:05.337618

"""

# revision identifiers, used by Alembic.
revision = 'd0fa685ff549'
down_revision = '5dc0a7b57c0f'

from alembic import context, op
import sqlalchemy as sa
import transaction
from simplejson import loads
from itertools import chain

from assembl.lib import config
from assembl.lib.clean_input import sanitize_text


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('idea', sa.Column('synthesis_title_id',
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

        idea_strings = db.execute(
            "SELECT id, short_title, long_title, definition FROM idea")
        idea_strings = {id: (short_title, long_title, definition)
            for (id, short_title, long_title, definition) in idea_strings}
        languages = {}
        parents = dict(list(db.execute(
            "SELECT target_id, source_id FROM idea_idea_link")))

        for idea in db.query(m.Idea):
            candidate_langs = locales_of_discussion[idea.discussion_id]
            (short_title, long_title, definition) = idea_strings[idea.id]
            if len(candidate_langs) == 1:
                lang = candidate_langs[0]
            else:
                text = ' '.join(filter(None, (
                    short_title or '',
                    sanitize_text(long_title or ''),
                    sanitize_text(definition or ''))))
                lang = None
                if text:
                    parent_lang = languages.get(parents.get(idea.id, None), None)
                    if parent_lang:
                        priors = {locale: 1 if locale == parent_lang else .1
                                  for locale in candidate_langs}
                    else:
                        priors = {locale: 1  for locale in candidate_langs}
                    lang, data = langid_services[idea.discussion_id].identify(text, expected_locales=priors)
                if not lang:
                    print "***** Could not identify for idea %d: %s" % (idea.id, text)
                    lang = candidate_langs[0]
            languages[idea.id] = lang

            def as_lang_string(text):
                ls = m.LangString.create(text, lang)
                ls.tombstone_date = idea.tombstone_date
                return ls
            if idea.title_id:
                if short_title:
                    assert short_title in [lse.value for lse in idea.title.entries]
            elif short_title:
                idea.title = as_lang_string(short_title)
            if idea.description_id:
                if idea.definition:
                    assert idea.definition in [lse.value for lse in idea.description.entries]
            elif definition:
                idea.description = as_lang_string(definition)
            if long_title:
                idea.synthesis_title = as_lang_string(long_title)

    with context.begin_transaction():
        op.drop_column('idea', 'long_title')
        op.drop_column('idea', 'short_title')
        op.drop_column('idea', 'definition')


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
