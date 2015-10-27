"""Ensure facebookAccounts have an app_id

Revision ID: 26caf0c8f768
Revises: 157237dd5620
Create Date: 2015-10-27 16:49:58.486625

"""

# revision identifiers, used by Alembic.
revision = '26caf0c8f768'
down_revision = '157237dd5620'

from alembic import context, op

from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.execute(
            "update facebook_account set app_id='%s' where app_id is null" %
            (config.get("facebook.consumer_key"),))


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
