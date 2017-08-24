"""clean html in messages

Revision ID: 5baafd563d59
Revises: 9b1d630ccd06
Create Date: 2017-08-20 09:45:02.369102

"""

# revision identifiers, used by Alembic.
revision = '5baafd563d59'
down_revision = '9b1d630ccd06'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    # Do stuff with the app's models here.
    from assembl import models as m
    from assembl.lib.clean_input import sanitize_html, sanitize_text
    db = m.get_session_maker()()
    with transaction.manager:
        # sanitize body of assemblposts (not imported posts)
        for lse in db.query(m.LangStringEntry
                ).join(m.AssemblPost,
                       m.Content.body_id == m.LangStringEntry.langstring_id
                ).filter(m.LangStringEntry.value.like('%<%')):
            lse.value = sanitize_html(lse.value)
        # sanitize subject of all posts
        for lse in db.query(m.LangStringEntry
                ).join(m.Content,
                       m.Content.subject_id == m.LangStringEntry.langstring_id
                ).filter(m.LangStringEntry.value.like('%<%')):
            lse.value = sanitize_text(lse.value)


def downgrade(pyramid_env):
    pass
