"""ensure inheritance

Revision ID: 227f09c8b8d4
Revises: 43df3099d52a
Create Date: 2015-05-19 16:00:32.297452

"""

# revision identifiers, used by Alembic.
revision = '227f09c8b8d4'
down_revision = '43df3099d52a'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config
from assembl.scripts.rebuild_tables import ensure_inheritance


def upgrade(pyramid_env):
    ensure_inheritance()

def downgrade(pyramid_env):
    pass
