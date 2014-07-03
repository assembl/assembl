"""fix broken virtuoso migration

Revision ID: 38239ae5d254
Revises: 1931a5603650
Create Date: 2014-06-30 20:22:30.308131

"""

# revision identifiers, used by Alembic.
revision = '38239ae5d254'
down_revision = '1931a5603650'

from alembic.migration import MigrationContext
from alembic.operations import Operations
import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker
import transaction

from assembl.lib import config

admin_engine = sa.create_engine('virtuoso://dba:dba@VOSU')
conn = admin_engine.connect()
admin_context = MigrationContext.configure(conn)
op = Operations(admin_context)

def upgrade(pyramid_env):
    with admin_context.begin_transaction():
        op.add_column('WS.WS.SYS_DAV_RES',
            sa.Column('RES_SIZE', sa.Integer))

def downgrade(pyramid_env):
    with admin_context.begin_transaction():
        op.drop_column('WS.WS.SYS_DAV_RES', 'RES_SIZE')
