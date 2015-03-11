"""deduplicate subscriptions

Revision ID: 2f9ca6738fb6
Revises: 44f588d96b14
Create Date: 2015-03-09 12:26:56.025030

"""

# revision identifiers, used by Alembic.
revision = '2f9ca6738fb6'
down_revision = '44f588d96b14'

from alembic import context, op
import sqlalchemy as sa
import transaction
from assembl.scripts.deduplicate_subscriptions import deduplicate

from assembl.lib import config

def upgrade(pyramid_env):
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        deduplicate(db)


def downgrade(pyramid_env):
    pass
