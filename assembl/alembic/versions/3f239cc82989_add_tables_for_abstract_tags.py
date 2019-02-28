"""Add tables for abstract tags

Revision ID: 3f239cc82989
Revises: 4f529b59026b
Create Date: 2019-02-22 17:33:55.001649

"""

# revision identifiers, used by Alembic.
revision = '3f239cc82989'
down_revision = '4f529b59026b'

from alembic import context, op
import sqlalchemy as sa
import transaction


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            "abstract_tag",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("value", sa.UnicodeText, nullable=False, index=True),
            sa.Column('discussion_id',
                sa.Integer,
                sa.ForeignKey(
                  'discussion.id',
                   ondelete="CASCADE",
                   onupdate="CASCADE"), nullable=False, index=True)
        )
        op.create_table(
            "tag_on_post",
            sa.Column("abstract_tag_id", sa.Integer, sa.ForeignKey('abstract_tag.id', ondelete="CASCADE", onupdate='CASCADE'),
                primary_key=True),
            sa.Column("post_id", sa.Integer, sa.ForeignKey('post.id', ondelete="CASCADE", onupdate="CASCADE"),
                primary_key=True)
        )


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('tag_on_post')
        op.drop_table('abstract_tag')

