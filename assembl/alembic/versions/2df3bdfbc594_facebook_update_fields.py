"""facebook_update_fields

Revision ID: 2df3bdfbc594
Revises: 227f09c8b8d4
Create Date: 2015-03-27 19:07:06.046621

"""

# revision identifiers, used by Alembic.
revision = '2df3bdfbc594'
down_revision = '227f09c8b8d4'

from alembic import context, op
import sqlalchemy as sa
import transaction
from virtuoso.alchemy import CoerceUnicode


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('abstract_agent_account',
            sa.Column('full_name', CoerceUnicode))

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('abstract_agent_account', 'full_name')
