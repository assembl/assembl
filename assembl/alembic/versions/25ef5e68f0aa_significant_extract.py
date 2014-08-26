"""significant extract

Revision ID: 25ef5e68f0aa
Revises: 47f08d228847
Create Date: 2014-08-26 15:25:21.892197

"""

# revision identifiers, used by Alembic.
revision = '25ef5e68f0aa'
down_revision = '47f08d228847'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'extract', sa.Column(
                'important', sa.SmallInteger, server_default='0'))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('extract', 'important')
