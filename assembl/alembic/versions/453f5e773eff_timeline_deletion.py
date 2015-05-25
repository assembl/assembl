"""timeline deletion

Revision ID: 453f5e773eff
Revises: 227f09c8b8d4
Create Date: 2015-05-24 22:18:38.437603

"""

# revision identifiers, used by Alembic.
revision = '453f5e773eff'
down_revision = '227f09c8b8d4'

from alembic import context
import transaction

from assembl.scripts.rebuild_tables import rebuild_fkey


def upgrade(pyramid_env):
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        fk = next(iter(
            m.TimelineEvent.__table__.c.previous_event_id.foreign_keys))
        rebuild_fkey(db, fk)


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
