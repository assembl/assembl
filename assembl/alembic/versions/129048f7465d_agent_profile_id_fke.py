"""agent_profile.id fkey to user.id on Extract.

Revision ID: 129048f7465d
Revises: 36fafd61052a
Create Date: 2013-08-14 10:41:27.516337

"""

# revision identifiers, used by Alembic.
revision = '129048f7465d'
down_revision = '36fafd61052a'

from alembic import context, op
import sqlalchemy as sa
import transaction

from assembl.lib import config


def upgrade(pyramid_env):
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
            ['owner_id'],
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
            'agent_profile',
            ['owner_id'],
            ['id']
        )

        op.create_foreign_key(
            'extract_creator_id_fkey',
            'extract',
            'agent_profile',
            ['owner_id'],
            ['id']
        )
