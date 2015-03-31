"""idprovider_account_uniqueness2

Revision ID: 2c1cd2d2af9b
Revises: 2c22018cd788
Create Date: 2015-03-31 13:19:12.262235

"""

# revision identifiers, used by Alembic.
revision = '2c1cd2d2af9b'
down_revision = '2c22018cd788'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_unique_constraint('uq_provider_id',
            'idprovider_agent_account', ['provider_id','userid'] )

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_constraint('uq_provider_id', 'idprovider_agent_account')
