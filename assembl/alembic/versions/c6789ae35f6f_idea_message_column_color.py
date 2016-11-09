"""idea_message_column.color

Revision ID: c6789ae35f6f
Revises: e0206b682f5c
Create Date: 2016-11-09 08:16:37.025836

"""

# revision identifiers, used by Alembic.
revision = 'c6789ae35f6f'
down_revision = 'e0206b682f5c'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            "idea_message_column",
            sa.Column("color", sa.String(20)))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column("idea_message_column", "color")
