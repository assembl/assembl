"""extract.id is an integer

Revision ID: 22ccb18547ea
Revises: 3b3547b5030a
Create Date: 2013-08-19 02:53:54.570766

"""

# revision identifiers, used by Alembic.
revision = '22ccb18547ea'
down_revision = '3b3547b5030a'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl import models as m
from assembl.lib import config, types

db = m.DBSession


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('extract', 'id')
        op.add_column(
            'extract',
            sa.Column('id', sa.Integer, primary_key=True))

    # Do stuff with the app's models here.
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('extract', 'id')
        op.add_column(
            'extract',
            sa.Column('id', types.UUID, primary_key=True))
