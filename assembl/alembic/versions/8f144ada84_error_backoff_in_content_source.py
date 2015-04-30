"""error_backoff in content_source

Revision ID: 8f144ada84
Revises: 475125b7bfe3
Create Date: 2015-04-30 15:39:06.539895

"""

# revision identifiers, used by Alembic.
revision = '8f144ada84'
down_revision = '475125b7bfe3'

from alembic import context, op
import sqlalchemy as sa


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('content_source',
            sa.Column('error_backoff_until', sa.DateTime))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('content_source', 'error_backoff_until')

