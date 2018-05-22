"""longer preferred_email

Revision ID: 14296672081d
Revises: 384c371312a8
Create Date: 2016-05-15 19:32:12.064005

"""

# revision identifiers, used by Alembic.
revision = '14296672081d'
down_revision = '384c371312a8'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.alter_column('user', 'preferred_email', type_=sa.String(100))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.alter_column('user', 'preferred_email', type_=sa.String(50))
