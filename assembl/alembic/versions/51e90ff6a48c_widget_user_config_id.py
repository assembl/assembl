"""widget_user_config_id

Revision ID: 51e90ff6a48c
Revises: 10d81337e9f1
Create Date: 2014-06-06 12:57:02.325938

"""

# revision identifiers, used by Alembic.
revision = '51e90ff6a48c'
down_revision = '10d81337e9f1'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        # D'oh!
        op.add_column('widget_user_config',
            sa.Column('id', sa.Integer, primary_key=True))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('widget_user_config', 'id')
