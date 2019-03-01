"""Add tables for tags association with posts

Revision ID: 3f239cc82989
Revises: 96c1c41d223b
Create Date: 2019-02-22 17:33:55.001649

"""

# revision identifiers, used by Alembic.
revision = '3f239cc82989'
down_revision = '96c1c41d223b'

from alembic import context, op
import sqlalchemy as sa
import transaction


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'posts_tags_association',
            sa.Column('id',
                      sa.Integer,
                      sa.ForeignKey(
                            'tags_association.id',
                             ondelete="CASCADE",
                             onupdate="CASCADE"),
                      primary_key=True),
            sa.Column('post_id', sa.Integer, sa.ForeignKey('post.id'), nullable=False,))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('posts_tags_association')

