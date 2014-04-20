"""separate widget state

Revision ID: e546a1bde9
Revises: 12fd3dd74340
Create Date: 2014-04-20 10:51:39.237594

"""

# revision identifiers, used by Alembic.
revision = 'e546a1bde9'
down_revision = '12fd3dd74340'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('widget', sa.Column('state', sa.Text))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('widget', 'state')
