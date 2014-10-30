"""clear user templates

Revision ID: 499dcb6474f8
Revises: 33c20d131cb6
Create Date: 2014-10-30 07:47:51.490565

"""

# revision identifiers, used by Alembic.
revision = '499dcb6474f8'
down_revision = '33c20d131cb6'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    from assembl import models as m
    from assembl.auth import R_PARTICIPANT
    db = m.get_session_maker()()
    with transaction.manager:
        db.query(m.UserTemplate).filter(m.UserTemplate.id.in_(
            db.query(m.UserTemplate.id).join(m.Role).filter(
                m.Role.name != R_PARTICIPANT).subquery())
        ).delete(synchronize_session='fetch')


def downgrade(pyramid_env):
    pass
