"""agent_profile.id fkey to user.id on Action.

Revision ID: 115b4d7ab81
Revises: 129048f7465d
Create Date: 2013-08-14 11:35:13.880639

"""

# revision identifiers, used by Alembic.
revision = '115b4d7ab81'
down_revision = '129048f7465d'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl import models as m
from assembl.lib import config

db = m.DBSession


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_constraint('action_actor_id_fkey', 'action')
        op.create_foreign_key(
            'action_actor_id_fkey',
            'action',
            'user',
            ['actor_id'],
            ['id']
        )


    # Do stuff with the app's models here.
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_constraint('action_actor_id_fkey', 'action')
        op.create_foreign_key(
            'action_actor_id_fkey',
            'action',
            'agent_profile',
            ['actor_id'],
            ['id']
        )
