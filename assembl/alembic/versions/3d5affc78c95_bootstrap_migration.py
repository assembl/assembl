"""bootstrap migration

Revision ID: 3d5affc78c95
Revises: None
Create Date: 2012-06-17 01:47:56.291476

"""

# revision identifiers, used by Alembic.
revision = '3d5affc78c95'
down_revision = None

from alembic import context, op
import sqlalchemy as sa


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table('posts',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('date', sa.DateTime, nullable=False),
            sa.Column('author', sa.Unicode(1024), nullable=False),
            sa.Column('subject', sa.Unicode(1024)),
            sa.Column('body', sa.UnicodeText, nullable=False),
            sa.Column('headers', sa.Text(), nullable=True))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('posts')
