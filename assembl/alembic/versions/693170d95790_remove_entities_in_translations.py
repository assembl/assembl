"""remove entities in translations

Revision ID: 693170d95790
Revises: 5baafd563d59
Create Date: 2017-09-11 08:40:32.676764

"""

# revision identifiers, used by Alembic.
revision = '693170d95790'
down_revision = '5baafd563d59'

from alembic import context, op
import sqlalchemy as sa
from sqlalchemy.orm import aliased
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    # Do stuff with the app's models here.
    from assembl import models as m
    from assembl.lib.clean_input import unescape
    db = m.get_session_maker()()
    with transaction.manager:
        lse = aliased(m.LangStringEntry)
        q = db.query(m.Content).join(lse, lse.langstring_id==m.Content.body_id
            ).join(m.Locale
            ).filter(m.Locale.code.like("%-x-mtfrom-%")
            ).add_entity(lse)
        for content, entry in q:
            if content.get_body_mime_type() == 'text/plain':
                entry.value = unescape(entry.value)
        q = db.query(lse).join(m.Content, lse.langstring_id==m.Content.subject_id
            ).join(m.Locale
            ).filter(m.Locale.code.like("%-x-mtfrom-%"))
        for entry in q:
            entry.value = unescape(entry.value)


def downgrade(pyramid_env):
    pass
