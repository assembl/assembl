"""idea column ordering

Revision ID: 2f0a72a2f3ec
Revises: 335e41a86a6b
Create Date: 2016-12-06 14:33:02.062676

"""

# revision identifiers, used by Alembic.
revision = '2f0a72a2f3ec'
down_revision = '335e41a86a6b'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        m.IdeaMessageColumn.ensure_ordering()


def downgrade(pyramid_env):
    pass
