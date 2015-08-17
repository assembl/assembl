"""DiscussionKVPairs

Revision ID: 1e1d2b26db86
Revises: 3d8923f4657a
Create Date: 2015-08-17 09:11:11.021181

"""

# revision identifiers, used by Alembic.
revision = '1e1d2b26db86'
down_revision = '3d8923f4657a'

from alembic import context, op
import sqlalchemy as sa

from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'discussion_peruser_namespaced_key_value',
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("namespace", sa.String, index=True),
            sa.Column("key", sa.String, index=True),
            sa.Column("value", sa.Text),
            sa.Column("user_id", sa.Integer,
                      sa.ForeignKey("user.id")),
            sa.Column("discussion_id", sa.Integer,
                      sa.ForeignKey("discussion.id")),
            sa.schema.UniqueConstraint(
                "discussion_id", "namespace", "key", "user_id"))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('discussion_peruser_namespaced_key_value')
