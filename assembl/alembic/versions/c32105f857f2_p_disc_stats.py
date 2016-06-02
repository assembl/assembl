"""p_disc_stats

Revision ID: c32105f857f2
Revises: 632623e9685d
Create Date: 2016-06-02 06:24:01.620053

"""

# revision identifiers, used by Alembic.
revision = 'c32105f857f2'
down_revision = '632623e9685d'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    from assembl import models as m
    from assembl.auth import P_ADMIN_DISC, P_DISC_STATS

    db = m.get_session_maker()()
    # give statistics access to whoever already has admin_discs.
    # We want to add to moderators, but we'll do this by hand.
    with transaction.manager:
        p_admin_disc = db.query(m.Permission).filter_by(name=P_ADMIN_DISC).one()
        p_disc_stats = db.query(m.Permission).filter_by(name=P_DISC_STATS).one()
        dps = db.query(m.DiscussionPermission).filter_by(
            permission_id=p_admin_disc.id)
        for dp in dps:
            db.add(m.DiscussionPermission(
                discussion_id = dp.discussion_id,
                role_id = dp.role_id,
                permission_id = p_disc_stats.id))


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
