"""add participant templates to existing discussions

Revision ID: 187cdadb065f
Revises: 48a07f038fe1
Create Date: 2014-11-11 13:40:40.497189

"""

# revision identifiers, used by Alembic.
revision = '187cdadb065f'
down_revision = '48a07f038fe1'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        for d in db.query(m.Discussion).all():
            d.get_participant_template()


def downgrade(pyramid_env):
    pass
