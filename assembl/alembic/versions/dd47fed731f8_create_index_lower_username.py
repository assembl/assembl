"""create index lower username

Revision ID: dd47fed731f8
Revises: d95bd110bf00
Create Date: 2018-08-08 11:48:17.316897

"""

# revision identifiers, used by Alembic.
revision = 'dd47fed731f8'
down_revision = 'd95bd110bf00'

from alembic import context, op
from sqlalchemy import text


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_index('ix_public_username_username_ci', 'username', [text('lower(username)')])


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_index('ix_public_username_username_ci', 'username')
