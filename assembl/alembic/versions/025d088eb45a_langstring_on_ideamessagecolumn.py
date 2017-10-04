"""langstring on IdeaMessageColumn header and synthesis

Revision ID: 025d088eb45a
Revises: aad68410c38b
Create Date: 2017-10-02 11:53:58.487121

"""

# revision identifiers, used by Alembic.
revision = '025d088eb45a'
down_revision = 'aad68410c38b'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config
from assembl.lib.clean_input import sanitize_text


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('idea_message_column', sa.Column('header_id',
                      sa.Integer(), sa.ForeignKey('langstring.id')))

    # Do stuff with the app's models here.
    from assembl import models as m
    from assembl.nlp.translation_service import LanguageIdentificationService
    db = m.get_session_maker()()

    with transaction.manager:
        ds = db.query(m.Discussion).all()
        locales_of_discussion = {d.id: d.discussion_locales for d in ds}
        langid_services = {d.id: LanguageIdentificationService(d) for d in ds
                           if len(locales_of_discussion[d.id]) > 1}

        im_column_strings = dict(list(db.execute(
            "SELECT id, header FROM idea_message_column")))

        for im_column in db.query(m.IdeaMessageColumn):
            candidate_langs = locales_of_discussion[im_column.idea.discussion_id]
            header = im_column_strings[im_column.id]
            if len(candidate_langs) == 1:
                lang = candidate_langs[0]
            else:
                lang = None
                if header:
                    # Use idea language for priors?
                    lang, data = langid_services[im_column.idea.discussion_id].identify(header)
                if not lang:
                    print "***** Could not identify for IdeaMessageColumn %d: %s" % (im_column.id, header)
                    lang = candidate_langs[0]

            if header:
                im_column.header = m.LangString.create(header, lang)

    with context.begin_transaction():
        op.drop_column('idea_message_column', 'header')

def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
