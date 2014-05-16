"""idea tombstone

Revision ID: 523425ac5b3b
Revises: 1fd30009e8b8
Create Date: 2014-05-16 14:54:47.795283

"""

# revision identifiers, used by Alembic.
revision = '523425ac5b3b'
down_revision = '1fd30009e8b8'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'idea', sa.Column(
                'is_tombstone', sa.Boolean, server_default='0'))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('idea', 'is_tombstone')
