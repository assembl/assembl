"""Changing Discussion.owner_id from FK on AgentProfile to User

Revision ID: 36fafd61052a
Revises: 2206dfd19893
Create Date: 2013-08-14 05:36:03.216100

"""

# revision identifiers, used by Alembic.
revision = '36fafd61052a'
down_revision = '2206dfd19893'

from alembic import context, op
import sqlalchemy as sa
import transaction

from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        # Drop the constraint
        op.drop_constraint('discussion_owner_id_fkey', 'discussion')

        # Normally you'd have to migrate the data by setting the appropriate
        # user.id in the owner_id field, but not this time. user.id has a
        # foreign key constraint on agent_profile.id right now. 

        # Add a constraint for the user.id
        op.create_foreign_key(
            'discussion_owner_id_fkey',
            'discussion',
            'user',
            ['owner_id'],
            ['id']
        )

    # Do stuff with the app's models here.
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        # Drop the constraint
        op.drop_constraint('discussion_owner_id_fkey', 'discussion')

        # Add a constraint for the user.id
        op.create_foreign_key(
            'discussion_owner_id_fkey',
            'discussion',
            'agent_profile',
            ['owner_id'],
            ['id']
        )
