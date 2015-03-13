"""discussion languages

Revision ID: 599eb2e48439
Revises: 2f9ca6738fb6
Create Date: 2015-03-09 13:14:25.180624

"""

# revision identifiers, used by Alembic.
revision = '599eb2e48439'
down_revision = '2f9ca6738fb6'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'discussion',
            sa.Column('preferred_locales', sa.String()))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('discussion', 'preferred_locales')
