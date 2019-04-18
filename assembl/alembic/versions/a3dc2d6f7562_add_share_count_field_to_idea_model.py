"""Add share count field to idea model

Revision ID: a3dc2d6f7562
Revises: 464b02fb1006
Create Date: 2019-04-15 18:00:09.125708

"""

# revision identifiers, used by Alembic.
revision = 'a3dc2d6f7562'
down_revision = '464b02fb1006'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('idea', sa.Column('share_count', sa.Integer))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('idea', 'share_count')
