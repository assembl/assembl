"""add PostWithMetadata

Revision ID: 2ab6e44b72d3
Revises: 4bff86bd0ef4
Create Date: 2014-10-16 10:17:04.470440

"""

# revision identifiers, used by Alembic.
revision = '2ab6e44b72d3'
down_revision = '4bff86bd0ef4'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'post_with_metadata',
            sa.Column('id', sa.Integer, sa.ForeignKey(
                'assembl_post.id'), primary_key=True),
            sa.Column('metadata_raw', sa.Text))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('post_with_metadata')
