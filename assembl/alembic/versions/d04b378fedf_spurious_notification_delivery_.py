"""spurious Notification.delivery_confirmation_date

Revision ID: d04b378fedf
Revises: 28a8fd62693b
Create Date: 2015-07-21 10:17:06.740524

"""

# revision identifiers, used by Alembic.
revision = 'd04b378fedf'
down_revision = '28a8fd62693b'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        # This was set by a stupid default, never by real data
        op.execute('update notification set delivery_confirmation_date=null')

def downgrade(pyramid_env):
    pass
