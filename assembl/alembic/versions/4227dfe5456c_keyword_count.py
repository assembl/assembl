"""keyword_count

Revision ID: 4227dfe5456c
Revises: 798b61d37451
Create Date: 2019-01-25 09:26:23.627532

"""

# revision identifiers, used by Alembic.
revision = '4227dfe5456c'
down_revision = '798b61d37451'

from alembic import context, op
import sqlalchemy as sa


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'post_keyword_analysis',
            sa.Column('occurences', sa.Integer))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('post_keyword_analysis', 'occurences')
