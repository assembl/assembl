"""kill weird links

Revision ID: 49432c8ab71b
Revises: 54cf00f049c2
Create Date: 2015-07-02 19:24:32.646353

"""

# revision identifiers, used by Alembic.
revision = '49432c8ab71b'
down_revision = '54cf00f049c2'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config
from assembl.scripts.link_cleanup import kill_weird_links

def upgrade(pyramid_env):
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        kill_weird_links(db)


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
