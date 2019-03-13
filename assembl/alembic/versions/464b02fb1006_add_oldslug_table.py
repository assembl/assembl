"""Add OldSlug table

Revision ID: 464b02fb1006
Revises: 3f239cc82989
Create Date: 2019-01-30 19:56:25.220864

"""

# revision identifiers, used by Alembic.
revision = '464b02fb1006'
down_revision = '3f239cc82989'

from alembic import context, op
import sqlalchemy as sa


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'old_slug',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('discussion_id', sa.Integer,
                      sa.ForeignKey('discussion.id', ondelete="CASCADE",
                                    onupdate="CASCADE"), nullable=False),
            sa.Column('slug', sa.Unicode, nullable=False),
            sa.Column('redirection_slug', sa.Unicode, nullable=False))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table("old_slug")
