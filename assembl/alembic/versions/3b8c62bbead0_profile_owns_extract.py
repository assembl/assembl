"""profile owns extract, not user

Revision ID: 3b8c62bbead0
Revises: 1af8bd2cb75e
Create Date: 2013-10-14 14:25:55.305746

"""

# revision identifiers, used by Alembic.
revision = '3b8c62bbead0'
down_revision = '1af8bd2cb75e'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl import models as m
from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_constraint('extract_owner_id_fkey', 'extract')
        op.drop_constraint('extract_creator_id_fkey', 'extract')
        op.create_foreign_key(
            'extract_owner_id_fkey',
            'extract',
            'agent_profile',
            ['owner_id'],
            ['id']
        )
        op.create_foreign_key(
            'extract_creator_id_fkey',
            'extract',
            'agent_profile',
            ['creator_id'],
            ['id']
        )

    # Do stuff with the app's models here.
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_constraint('extract_owner_id_fkey', 'extract')
        op.drop_constraint('extract_creator_id_fkey', 'extract')
        op.create_foreign_key(
            'extract_owner_id_fkey',
            'extract',
            'user',
            ['owner_id'],
            ['id']
        )
        op.create_foreign_key(
            'extract_creator_id_fkey',
            'extract',
            'user',
            ['creator_id'],
            ['id']
        )
