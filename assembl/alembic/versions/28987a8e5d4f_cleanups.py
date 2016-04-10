"""cleanups

Revision ID: 28987a8e5d4f
Revises: 4bfa6908f218
Create Date: 2016-04-10 09:38:39.729777

"""

# revision identifiers, used by Alembic.
revision = '28987a8e5d4f'
down_revision = '4bfa6908f218'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    # cleanup some spurious data
    with context.begin_transaction():
        op.execute(
            """UPDATE abstract_agent_account SET email=NULL
            WHERE email IS NOT NULL AND NOT(email LIKE '%@%')""")

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        for action in db.query(m.Action).filter_by(actor_id=-1):
            action.delete()


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
