"""anonymous user

Revision ID: 301275210522
Revises: 2c1cd2d2af9b
Create Date: 2015-04-03 16:33:05.871503

"""

# revision identifiers, used by Alembic.
revision = '301275210522'
down_revision = '2c1cd2d2af9b'

from alembic import context, op
import sqlalchemy as sa


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            "anonymous_user",
            sa.Column(
                'id', sa.Integer, sa.ForeignKey(
                    'user.id', ondelete='CASCADE', onupdate='CASCADE'),
                    primary_key=True),
            sa.Column('source_id', sa.Integer, sa.ForeignKey(
                "content_source.id", ondelete='CASCADE', onupdate='CASCADE'),
                unique=True))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table("anonymous_user")
