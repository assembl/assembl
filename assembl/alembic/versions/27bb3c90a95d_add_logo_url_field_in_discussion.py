"""add logo_url field in discussion

Revision ID: 27bb3c90a95d
Revises: 2f0fc6545b35
Create Date: 2016-02-11 14:42:56.819972

"""

# revision identifiers, used by Alembic.
revision = '27bb3c90a95d'
down_revision = '2f0fc6545b35'

from alembic import context, op
import sqlalchemy as sa
import transaction
from assembl.lib.sqla_types import URLString


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('discussion', sa.Column('logo_url', URLString,
                                              nullable=True, default=None))

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('discussion', 'logo_url')
