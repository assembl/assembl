"""add discussion.help_url

Revision ID: 33d7d4945aa3
Revises: 8f144ada84
Create Date: 2015-05-04 10:56:24.276578

"""

# revision identifiers, used by Alembic.
revision = '33d7d4945aa3'
down_revision = '8f144ada84'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'discussion',
            sa.Column('help_url', sa.String(), nullable=True))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('discussion', 'help_url')
