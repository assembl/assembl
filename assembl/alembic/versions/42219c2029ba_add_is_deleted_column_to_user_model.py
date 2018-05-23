"""Add_is_deleted_column_to_user_model

Revision ID: 42219c2029ba
Revises: 2a7357d60fa5
Create Date: 2018-04-18 10:39:09.772934

"""

# revision identifiers, used by Alembic.
revision = '42219c2029ba'
down_revision = '2a7357d60fa5'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('user', sa.Column('is_deleted', sa.Boolean, default=False))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('user', 'is_deleted')
