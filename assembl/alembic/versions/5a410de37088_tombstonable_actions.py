"""tombstonable actions

Revision ID: 5a410de37088
Revises: 163294913218
Create Date: 2015-06-19 16:09:03.510558

"""

# revision identifiers, used by Alembic.
revision = '5a410de37088'
down_revision = '163294913218'

from alembic import context, op
import sqlalchemy as sa


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('action', sa.Column('tombstone_date', sa.DateTime))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('action', 'tombstone_date')
