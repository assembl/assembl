"""db files to hashfs

Revision ID: e7b56b85b1f5
Revises: 57c8fb47480b
Create Date: 2018-03-19 17:13:50.958073

"""

# revision identifiers, used by Alembic.
revision = 'e7b56b85b1f5'
down_revision = '57c8fb47480b'

from io import BytesIO
from os import path, utime
from datetime import datetime
from calendar import timegm

from alembic import context, op
import sqlalchemy as sa
import transaction

from assembl.lib import config
from assembl.lib.sqla import mark_changed
from assembl.lib.hash_fs import get_hashfs


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('file', sa.Column('file_identity', sa.String(64), index=True))

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    hash_fs = get_hashfs()
    with transaction.manager:
        # document.creation_date?
        for fid, title, creation_date, data in db.execute(
                """SELECT file.id, document.title, document.creation_date, file.data
                FROM file JOIN document using(id)"""):
            data = BytesIO(data)
            data.seek(0)
            parts = title.split('.')
            extension = parts[-1] if len(parts) > 1 else None
            address = hash_fs.put(data, extension)
            creation_date = creation_date or datetime.now()
            creation_date = timegm(creation_date.timetuple())
            if address.is_duplicate:
                creation_date = min(creation_date, path.getmtime(address.abspath))
            utime(address.abspath, (creation_date, creation_date))
            db.execute("UPDATE file SET file_identity='%s' WHERE id=%d" % (address.id, fid))
        mark_changed()

    with context.begin_transaction():
        op.drop_column('file', 'data')
    op.execute('vacuum full', {'isolation_level':'AUTOCOMMIT'})


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('file', sa.Column('data', sa.LargeBinary))

    from assembl import models as m
    db = m.get_session_maker()()
    hash_fs = get_hashfs()

    with transaction.manager:
        for fid, fhash in db.execute(
                "SELECT id, file_identity FROM file WHERE data IS NULL"):
            with open(hash_fs.get(fhash).abspath, 'rb') as f:
                data = f.read()
            db.execute(sa.text("UPDATE file SET data=:data WHERE id=:id").bindparams(
                sa.bindparam('id', value=fid),
                sa.bindparam('data', value=data, type_=sa.LargeBinary)))
        mark_changed()

    with context.begin_transaction():
        op.alter_column("file", "data", nullable=False)
        op.drop_column('file', 'file_identity')
