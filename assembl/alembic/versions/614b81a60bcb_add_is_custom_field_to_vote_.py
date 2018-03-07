"""add_is_custom_field_to_vote_specifications

Revision ID: 614b81a60bcb
Revises: 53af22ed84c1
Create Date: 2018-03-01 12:00:04.177919

"""

# revision identifiers, used by Alembic.
revision = '614b81a60bcb'
down_revision = '53af22ed84c1'

from alembic import context, op
import sqlalchemy as sa
import transaction

from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'vote_specification',
            sa.Column('is_custom', sa.Boolean()))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('vote_specification', 'is_custom')
