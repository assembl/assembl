"""Create extract_comment table

Revision ID: 989291bb0cf1
Revises: cdc98f9b55c2
Create Date: 2018-10-02 16:45:38.747711

"""

# revision identifiers, used by Alembic.
revision = '989291bb0cf1'
down_revision = 'cdc98f9b55c2'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'extract_comment',
            sa.Column(
                'id', sa.Integer, sa.ForeignKey(
                    'post.id', ondelete='CASCADE',
                    onupdate='CASCADE'), primary_key=True),
            sa.Column(
                'parent_extract_id', sa.Integer, sa.ForeignKey(
                    'extract.id', ondelete='CASCADE',
                    onupdate='CASCADE'), nullable=False, index=True))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('extract_comment')
