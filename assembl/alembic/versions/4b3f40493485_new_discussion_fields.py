"""new discussion fields

Revision ID: 4b3f40493485
Revises: 2e13e10be574
Create Date: 2014-08-04 11:35:21.253147

"""

# revision identifiers, used by Alembic.
revision = '4b3f40493485'
down_revision = '2e13e10be574'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('discussion', sa.Column(
            'objectives', sa.UnicodeText))

def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('discussion', 'objectives')
