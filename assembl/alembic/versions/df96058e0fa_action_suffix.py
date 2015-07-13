"""action suffix

Revision ID: df96058e0fa
Revises: ff520e781a4
Create Date: 2015-07-13 07:23:56.311962

"""

# revision identifiers, used by Alembic.
revision = 'df96058e0fa'
down_revision = 'ff520e781a4'

from alembic import context, op

from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.execute(""" UPDATE action SET "type"=concat("type",'_P') """)


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.execute(
            'UPDATE action SET "type"=subseq("type",0,length("type")-2)')
