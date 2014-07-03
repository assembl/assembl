"""widget status; store context link

Revision ID: 328e132a35de
Revises: 1593228f01ab
Create Date: 2014-06-25 09:27:59.054020

"""

# revision identifiers, used by Alembic.
revision = '328e132a35de'
down_revision = '38239ae5d254'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('idea_widget_link',
                      sa.Column('context_url', sa.String()))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('idea_widget_link', 'context_url')
