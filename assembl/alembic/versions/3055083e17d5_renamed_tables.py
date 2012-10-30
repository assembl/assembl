"""renamed_tables

Revision ID: 3055083e17d5
Revises: 1f236361ce82
Create Date: 2012-10-27 17:25:41.177102

"""

# revision identifiers, used by Alembic.
revision = '3055083e17d5'
down_revision = '121822bb8a65'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl import models as m
from assembl.lib import config

db = m.DBSession


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.rename_table('emails', 'email')
        op.rename_table('posts', 'post')

    # Do stuff with the app's models here.
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.rename_table('email', 'emails')
        op.rename_table('post', 'posts')
