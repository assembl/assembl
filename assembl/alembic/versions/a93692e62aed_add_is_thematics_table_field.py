"""add_is_thematics_table_field

Revision ID: a93692e62aed
Revises: 8d704ad414e4
Create Date: 2018-06-11 11:32:50.719452

"""

# revision identifiers, used by Alembic.
revision = 'a93692e62aed'
down_revision = '8d704ad414e4'

from alembic import context, op
import sqlalchemy as sa
import transaction

from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'timeline_event',
            sa.Column('is_thematics_table', sa.Boolean()))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('timeline_event', 'is_thematics_table')
