"""idea_message_column

Revision ID: e0206b682f5c
Revises: 6a004f0fc7e8
Create Date: 2016-11-04 12:19:33.328394

"""

# revision identifiers, used by Alembic.
revision = 'e0206b682f5c'
down_revision = '6a004f0fc7e8'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            "idea_message_column",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("idea_id", sa.Integer, sa.ForeignKey("idea.id"), index=True, nullable=False),
            sa.Column("message_classifier", sa.String(100), index=True, nullable=False),
            sa.Column("header", sa.UnicodeText),
            sa.Column("previous_column_id", sa.Integer, sa.ForeignKey("idea_message_column.id"), unique=True),
            sa.Column("name_id", sa.Integer, sa.ForeignKey("langstring.id"), nullable=False),
            sa.UniqueConstraint('idea_id', 'message_classifier'))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table("idea_message_column")
