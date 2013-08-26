"""Renaming actions on posts' tables.

Revision ID: 35de09f6083c
Revises: e02fc0d0e4e
Create Date: 2013-08-26 13:26:56.834093

"""

# revision identifiers, used by Alembic.
revision = '35de09f6083c'
down_revision = 'e02fc0d0e4e'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl import models as m
from assembl.lib import config

db = m.DBSession


def upgrade(pyramid_env):
    with context.begin_transaction():

        op.rename_table('view', 'action_view_post')
        op.rename_table('collapse', 'action_collapse_post')
        op.rename_table('expand', 'action_expand_post')

    # Do stuff with the app's models here.
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():

        op.rename_table('action_view_post', 'view')
        op.rename_table('action_collapse_post', 'collapse')
        op.rename_table('action_expand_post', 'expand')
