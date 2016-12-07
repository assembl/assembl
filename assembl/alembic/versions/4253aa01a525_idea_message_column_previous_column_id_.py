"""idea_message_column.previous_column_id.ondelete

Revision ID: 4253aa01a525
Revises: 2f0a72a2f3ec
Create Date: 2016-12-07 06:25:24.625025

"""

# revision identifiers, used by Alembic.
revision = '4253aa01a525'
down_revision = '2f0a72a2f3ec'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_constraint(
            "idea_message_column_previous_column_id_fkey", "idea_message_column")
        op.create_foreign_key(
            "idea_message_column_previous_column_id_fkey", "idea_message_column",
            "idea_message_column", ["previous_column_id"], ["id"],
            ondelete="SET NULL")


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_constraint(
            "idea_message_column_previous_column_id_fkey", "idea_message_column")
        op.create_foreign_key(
            "idea_message_column_previous_column_id_fkey", "idea_message_column",
            "idea_message_column", ["previous_column_id"], ["id"])
