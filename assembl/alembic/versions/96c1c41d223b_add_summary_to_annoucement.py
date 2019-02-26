"""Add summary to Annoucement

Revision ID: 96c1c41d223b
Revises: 4f529b59026b
Create Date: 2019-01-30 16:09:20.331375

"""

# revision identifiers, used by Alembic.
revision = '96c1c41d223b'
down_revision = '4f529b59026b'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'announce', sa.Column('summary_id',
            sa.Integer(), sa.ForeignKey('langstring.id')))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('announce', 'summary_id')
