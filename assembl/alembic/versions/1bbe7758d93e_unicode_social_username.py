"""unicode social username

Revision ID: 1bbe7758d93e
Revises: 14296672081d
Create Date: 2016-05-16 06:53:53.204274

"""

# revision identifiers, used by Alembic.
revision = '1bbe7758d93e'
down_revision = '14296672081d'

from alembic import context, op
import sqlalchemy as sa
import transaction

from assembl.lib import config
from assembl.lib.sqla import mark_changed


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.alter_column('social_auth_account', 'username', type_=sa.Unicode(200))



def downgrade(pyramid_env):
    with context.begin_transaction():
        op.alter_column('social_auth_account', 'username', type_=sa.Unicode(200))
