"""add more discussion fields

Revision ID: 47f08d228847
Revises: 4b3f40493485
Create Date: 2014-08-13 16:21:38.869138

"""

# revision identifiers, used by Alembic.
revision = '47f08d228847'
down_revision = '4b3f40493485'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('discussion', sa.Column(
            'instigator', sa.UnicodeText))
        op.add_column('discussion', sa.Column(
            'introduction', sa.UnicodeText))
        op.add_column('discussion', sa.Column(
            'introductionDetails', sa.UnicodeText))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('discussion', 'instigator')
        op.drop_column('discussion', 'introduction')
        op.drop_column('discussion', 'introductionDetails')

