"""qnames for actions

Revision ID: 2e13e10be574
Revises: 31c0cfa82b14
Create Date: 2014-07-26 14:51:17.552771

"""

# revision identifiers, used by Alembic.
revision = '2e13e10be574'
down_revision = '31c0cfa82b14'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.execute("""update action set type = 'version:ReadStatusChange'
            where type = 'view_post'""")

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.execute("""update action set type = 'view_post'
            where type = 'version:ReadStatusChange'""")
