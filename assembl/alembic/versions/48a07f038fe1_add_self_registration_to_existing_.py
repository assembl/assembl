"""add self-registration to existing discussions

Revision ID: 48a07f038fe1
Revises: 5592fcf1c810
Create Date: 2014-11-04 15:39:00.972779

"""

# revision identifiers, used by Alembic.
revision = '48a07f038fe1'
down_revision = '5592fcf1c810'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    # Do stuff with the app's models here.
    from assembl import models as m
    from assembl.auth import P_READ, P_SELF_REGISTER
    from pyramid.security import Authenticated, Everyone

    db = m.get_session_maker()()
    with transaction.manager:
        p_read = db.query(m.Permission).filter_by(name=P_READ).one()
        p_self_reg = db.query(m.Permission).filter_by(name=P_SELF_REGISTER).one()
        r_everyone = db.query(m.Role).filter_by(name=Everyone).one()
        r_authenticated = db.query(m.Role).filter_by(name=Authenticated).one()
        # Only open discussions, i.e. where everyone can read.
        dps = db.query(m.DiscussionPermission).filter_by(
            role_id=r_everyone.id, permission_id=p_read.id)
        for dp in dps:
            db.add(m.DiscussionPermission(
                discussion_id = dp.discussion_id,
                role_id = r_authenticated.id,
                permission_id = p_self_reg.id))


def downgrade(pyramid_env):
    pass
