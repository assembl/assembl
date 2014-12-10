"""Action.type as VARCHAR

Revision ID: 5ae3d1ed3134
Revises: 34dd4e942bde
Create Date: 2014-12-07 16:21:26.962768

"""

# revision identifiers, used by Alembic.
revision = '5ae3d1ed3134'
down_revision = '34dd4e942bde'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('action',
                      sa.Column('temp_type', sa.String(255), nullable=False))
        op.execute('UPDATE action SET temp_type = type')
        op.drop_column('action', 'type')
        op.add_column('action',
                      sa.Column('type', sa.String(255), nullable=False))
        op.execute('UPDATE action SET "type" = temp_type')
        op.drop_column('action', 'temp_type')


def downgrade(pyramid_env):
    pass
