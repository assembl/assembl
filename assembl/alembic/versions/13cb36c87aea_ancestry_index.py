"""ancestry index

Revision ID: 13cb36c87aea
Revises: 28987a8e5d4f
Create Date: 2016-04-14 10:28:30.754809

"""

# revision identifiers, used by Alembic.
revision = '13cb36c87aea'
down_revision = '28987a8e5d4f'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def schema_prefix():
    return config.get('db_schema')


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_index(
            "ix_%s_post_ancestry" % (schema_prefix(),),
            'post', ['ancestry'], unique=False,
            postgresql_ops={'ancestry': 'varchar_pattern_ops'})


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_index(
            "ix_%s_post_ancestry" % (schema_prefix(),), 'post')
