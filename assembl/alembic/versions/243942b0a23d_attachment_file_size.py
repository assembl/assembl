"""attachment_file_size

Revision ID: 243942b0a23d
Revises: 4227dfe5456c
Create Date: 2019-01-01 23:43:46.462949

"""

# revision identifiers, used by Alembic.
from __future__ import print_function

revision = '243942b0a23d'
down_revision = '4227dfe5456c'

from alembic import context, op
import sqlalchemy as sa
import transaction
from os import path

from assembl.lib import config
from assembl.lib.sqla import mark_changed

def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('file', sa.Column('file_size', sa.Integer))

    from assembl import models as m
    from assembl.lib.hash_fs import get_hashfs
    db = m.get_session_maker()()
    hashfs = get_hashfs()
    with transaction.manager:
        for id, fileHash in db.execute('SELECT id, file_identity FROM file'):
            if not fileHash: continue
            hash = hashfs.get(fileHash)
            if not hash:
                print("Missing hash:", id, fileHash)
                continue
            size = path.getsize(hash.abspath.encode('ascii'))
            if not size:
                print("Missing size:", id, fileHash)
                continue
            db.execute('UPDATE file SET file_size=%d WHERE id=%d' % (size, id))
        mark_changed()


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('file', 'file_size')
