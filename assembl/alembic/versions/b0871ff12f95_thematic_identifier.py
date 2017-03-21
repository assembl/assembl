"""thematic identifier

Revision ID: b0871ff12f95
Revises: 14e5db4fde8e
Create Date: 2017-03-21 12:28:59.518734

"""

# revision identifiers, used by Alembic.
revision = 'b0871ff12f95'
down_revision = '14e5db4fde8e'

from alembic import context, op
import sqlalchemy as sa


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'thematic',
            sa.Column('identifier', sa.String(60)))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('thematic', 'identifier')
