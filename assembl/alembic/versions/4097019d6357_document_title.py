"""document_title

Revision ID: 4097019d6357
Revises: 55cac5610448
Create Date: 2016-04-20 16:24:16.327436

"""

# revision identifiers, used by Alembic.
revision = '4097019d6357'
down_revision = '55cac5610448'

from alembic import context, op
import sqlalchemy as sa
import transaction
from bs4 import UnicodeDammit

from assembl.lib import config
from assembl.lib.sqla import mark_changed


def upgrade(pyramid_env):
    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()

    with transaction.manager:
        titles = list(db.execute(
            """SELECT id, title FROM document"""))

    with context.begin_transaction():
        op.drop_column('document', 'title')
        op.add_column('document',
                      sa.Column('title', sa.Unicode(1024), server_default=""))

    with transaction.manager:
        docs = m.Document.__table__
        for (id, title) in titles:
            db.execute(docs.update().where(docs.c.id == id).
                       values(title=sa.sql.expression.cast(
                              UnicodeDammit(title).unicode_markup,
                              sa.Unicode)))
        mark_changed()


def downgrade(pyramid_env):
    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()

    with transaction.manager:
        titles = list(db.execute(
            """SELECT id, title FROM document"""))

    with context.begin_transaction():
        op.drop_column('document', 'title')
        op.add_column('document', sa.Column('title',
                      sa.String(1024), server_default=""))

    with transaction.manager:
        docs = m.Document.__table__
        for (id, title) in titles:
            db.execute(
                docs.update().where(docs.c.id == id).values(title=title.encode('utf8'))
            )
        mark_changed()
