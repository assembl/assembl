"""data-message-id to id

Revision ID: 181c5188b517
Revises: 347da871761
Create Date: 2013-11-10 11:06:33.921679

"""

# revision identifiers, used by Alembic.
revision = '181c5188b517'
down_revision = '347da871761'

import re

from alembic import context, op
import sqlalchemy as sa
from sqlalchemy.orm import lazyload
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    from assembl.models import Extract, Mailbox
    db = Mailbox.db()
    with transaction.manager:
        for mb in db.query(Mailbox).all():
            Mailbox.reprocess_content(mb)
    db = Extract.db()
    with transaction.manager:
        q = db.execute('''
            SELECT extract.id, email.subject, email.body, post.id
            FROM extract
            JOIN email ON (email.id = extract.source_id)
            JOIN content ON (email.id = content.id)
            JOIN post ON (post.content_id = email.id)
            WHERE content.type = 'email'
            ''')
        vals = {ex_id: (sub, body, postid) for (ex_id, sub, body, postid) in q}
        for extract in db.query(Extract).options(lazyload('*')).all():
            v = vals.get(extract.id)
            if v:
                tfi = extract._infer_text_fragment_inner(*v)
                if tfi:
                    db.add(tfi)


def downgrade(pyramid_env):
    pass
