"""discussion json settings

Revision ID: 4df8698f9da8
Revises: 5ae3d1ed3134
Create Date: 2014-12-09 21:23:02.902813

"""

# revision identifiers, used by Alembic.
revision = '4df8698f9da8'
down_revision = '5ae3d1ed3134'

from alembic import context, op
import sqlalchemy as sa


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'discussion',
            sa.Column('settings', sa.Text()))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('discussion', 'settings')
