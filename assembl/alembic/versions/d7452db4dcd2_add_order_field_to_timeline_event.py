"""add_order_field_to_timeline_event

Revision ID: d7452db4dcd2
Revises: 4d6fcaafe1e6
Create Date: 2018-06-20 11:29:13.361158

"""

# revision identifiers, used by Alembic.
revision = 'd7452db4dcd2'
down_revision = '4d6fcaafe1e6'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'timeline_event',
            sa.Column('order', sa.Float, nullable=False, default=0.0, server_default='0'))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('timeline_event', 'order')
