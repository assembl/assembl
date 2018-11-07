"""change_username_size_limit

Revision ID: f8a3ebc5d6dd
Revises: 989291bb0cf1
Create Date: 2018-11-07 16:27:06.137456

"""

# revision identifiers, used by Alembic.
revision = 'f8a3ebc5d6dd'
down_revision = '989291bb0cf1'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    from assembl.lib.sqla_types import CoerceUnicode
    with context.begin_transaction():
        op.alter_column('username', 'username', type_=CoerceUnicode(40))

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.alter_column('username', 'username', type_=CoerceUnicode(20))
