"""langstring on synthesis

Revision ID: ca1c445a2e24
Revises: 025d088eb45a
Create Date: 2017-11-06 09:23:09.384341

"""

# revision identifiers, used by Alembic.
revision = 'ca1c445a2e24'
down_revision = '025d088eb45a'

from alembic import context, op
import sqlalchemy as sa
import transaction
from sqlalchemy.orm import (joinedload, subqueryload)


from assembl.lib import config
from assembl.lib.clean_input import sanitize_text


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('synthesis', sa.Column('subject_id',
                      sa.Integer(), sa.ForeignKey('langstring.id')))
        op.add_column('synthesis', sa.Column('introduction_id',
                      sa.Integer(), sa.ForeignKey('langstring.id')))
        op.add_column('synthesis', sa.Column('conclusion_id',
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

        synthesis_strings = db.execute(
            "SELECT id, subject, introduction, conclusion FROM synthesis")
        synthesis_strings = {id: (subject, introduction, conclusion)
            for (id, subject, introduction, conclusion) in synthesis_strings}

        for synthesis in db.query(m.Synthesis):
            candidate_langs = locales_of_discussion[synthesis.discussion_id]
            (subject, introduction, conclusion) = synthesis_strings[synthesis.id]
            if len(candidate_langs) == 1:
                lang = candidate_langs[0]
            else:
                text = ' '.join(filter(None, (
                    sanitize_text(subject or ''),
                    sanitize_text(introduction or ''),
                    sanitize_text(conclusion or ''),
                )))
                lang = None
                if text:
                    lang, data = langid_services[synthesis.discussion_id].identify(text)
                if not lang:
                    print "***** Could not identify for synthesis %d: %s" % (synthesis.id, text)
                    lang = candidate_langs[0]

            def as_lang_string(text):
                ls = m.LangString.create(text, lang)
                return ls

            if subject:
                synthesis.subject = as_lang_string(subject)
            if introduction:
                synthesis.introduction = as_lang_string(introduction)
            if conclusion:
                synthesis.conclusion = as_lang_string(conclusion)

    with context.begin_transaction():
        op.drop_column('synthesis', 'subject')
        op.drop_column('synthesis', 'introduction')
        op.drop_column('synthesis', 'conclusion')


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
