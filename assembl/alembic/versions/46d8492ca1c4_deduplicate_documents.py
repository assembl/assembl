"""Deduplicate documents

Revision ID: 46d8492ca1c4
Revises: 4bfc1da4d2e4
Create Date: 2015-10-14 10:00:26.526750

"""

# revision identifiers, used by Alembic.
revision = '46d8492ca1c4'
down_revision = '4bfc1da4d2e4'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config
from assembl.lib.sqla import mark_changed

def upgrade(pyramid_env):
    with context.begin_transaction():
        pass

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        to_delete = set()
        last_id = last_uri = None
        for (id, uri) in db.execute(
                'select id, uri_id from document order by uri_id'):
            if uri == last_uri:
                db.execute("""update attachment set document_id = %d
                    where document_id = %d""" % (last_id, id))
                to_delete.add(str(id))
            else:
                last_id = id
                last_uri = uri
        if to_delete:
            db.execute('delete from document where id in (' +
                ','.join(to_delete) + ')')
            mark_changed()


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
