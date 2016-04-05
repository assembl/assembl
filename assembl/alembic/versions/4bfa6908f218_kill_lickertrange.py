"""kill LickertRange

Revision ID: 4bfa6908f218
Revises: df59c42297f
Create Date: 2016-04-05 15:31:47.418304

"""

# revision identifiers, used by Alembic.
revision = '4bfa6908f218'
down_revision = 'df59c42297f'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column("lickert_idea_vote", "range_id")
        op.drop_table("lickert_range")


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            "lickert_range",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("minimum", sa.Integer),
            sa.Column("maximum", sa.Integer))
        # was non-nullable but I'm not reestablishing this now.
        op.add_column(
            "lickert_idea_vote",
            sa.Column("range_id", sa.Integer, sa.ForeignKey(
                "lickert_range.id", ondelete="CASCADE", onupdate="CASCADE")))
