"""discussion homepage

Revision ID: 3738207829e0
Revises: 250035d23e83
Create Date: 2015-12-18 05:18:14.926613

"""

# revision identifiers, used by Alembic.
revision = '3738207829e0'
down_revision = '250035d23e83'

from alembic import context, op
import sqlalchemy as sa
import transaction
from assembl.lib.sqla_types import URLString

from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('discussion', sa.Column('homepage_url', URLString,
                                              nullable=True, default=None))

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('discussion', 'homepage_url')
