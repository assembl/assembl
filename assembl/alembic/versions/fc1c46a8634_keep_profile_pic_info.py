"""keep profile pic info

Revision ID: fc1c46a8634
Revises: 523425ac5b3b
Create Date: 2014-05-26 08:42:16.664300

"""

# revision identifiers, used by Alembic.
revision = 'fc1c46a8634'
down_revision = '523425ac5b3b'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('idprovider_agent_account', sa.Column(
            'profile_info', sa.types.Text))
        op.add_column('idprovider_agent_account', sa.Column(
            'picture_url', sa.String(300)))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('idprovider_agent_account', 'profile_info')
        op.drop_column('idprovider_agent_account', 'picture_url')
