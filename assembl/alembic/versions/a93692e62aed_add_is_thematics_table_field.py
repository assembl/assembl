"""add_is_thematics_table_field

Revision ID: a93692e62aed
Revises: e3f681bd70e0
Create Date: 2018-06-11 11:32:50.719452

"""

# revision identifiers, used by Alembic.
revision = 'a93692e62aed'
down_revision = 'e3f681bd70e0'

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
