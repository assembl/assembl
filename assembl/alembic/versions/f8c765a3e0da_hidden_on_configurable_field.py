"""hidden_on_configurable_field

Revision ID: f8c765a3e0da
Revises: e757aefa55e1
Create Date: 2018-07-23 18:01:38.822435

"""

# revision identifiers, used by Alembic.
revision = 'f8c765a3e0da'
down_revision = '7bf35c9261d9'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
        "configurable_field",
        sa.Column("hidden", sa.Boolean, server_default='0')
        )


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column("configurable_field", "hidden")
