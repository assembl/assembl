"""revert idprovider_agent_account type change

Revision ID: 3c125512a81f
Revises: 3b8c62bbead0
Create Date: 2013-10-17 16:32:37.432689

"""

# revision identifiers, used by Alembic.
revision = '3c125512a81f'
down_revision = '3b8c62bbead0'

from alembic import context, op
import sqlalchemy as sa
import transaction

from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.execute("UPDATE abstract_agent_account "
            "SET type = 'idprovider_agent_account' WHERE type = 'idprovider_account'")

    # Do stuff with the app's models here.
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
