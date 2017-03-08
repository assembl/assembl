"""timeline_identifier

Revision ID: f6b4dabfe49e
Revises: 0888e0f1a92d
Create Date: 2017-03-08 08:57:47.379976

"""

# revision identifiers, used by Alembic.
revision = 'f6b4dabfe49e'
down_revision = '0888e0f1a92d'

from alembic import context, op
import sqlalchemy as sa


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'timeline_event',
            sa.Column('identifier', sa.String(60)))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('timeline_event', 'identifier')
