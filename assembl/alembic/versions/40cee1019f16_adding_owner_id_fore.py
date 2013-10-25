"""Adding owner_id foreign key to Discussion model.

Revision ID: 40cee1019f16
Revises: 43e84f11dbaf
Create Date: 2013-08-09 15:13:54.646856

"""

# revision identifiers, used by Alembic.
revision = '40cee1019f16'
down_revision = '43e84f11dbaf'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl import models as m
from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'discussion', 
            sa.Column(
                'owner_id',
                sa.Integer, 
                sa.ForeignKey('agent_profile.id'),
            )
        )

    # Do stuff with the app's models here.
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_constraint('owner_id_fkey', 'discussion')
        op.drop_column(
            'discussion',
            'ownder_id'
        )
