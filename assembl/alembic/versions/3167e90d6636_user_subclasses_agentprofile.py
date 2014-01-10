"""user subclasses agentprofile

Revision ID: 3167e90d6636
Revises: None
Create Date: 2014-01-09 09:13:45.551458

"""

# revision identifiers, used by Alembic.
revision = '3167e90d6636'
down_revision = None

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.execute(
            "update agent_profile set type='user' "
            "where id in (select id from \"user\")")


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.execute("update agent_profile set type='agent_profile'")
