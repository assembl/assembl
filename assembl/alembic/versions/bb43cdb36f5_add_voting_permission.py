"""add voting permission

Revision ID: bb43cdb36f5
Revises: 4df8698f9da8
Create Date: 2014-12-16 19:06:51.564046

"""

# revision identifiers, used by Alembic.
revision = 'bb43cdb36f5'
down_revision = '4df8698f9da8'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    from assembl import models as m
    from assembl.auth import P_ADD_POST, P_VOTE
    from pyramid.security import Authenticated, Everyone

    db = m.get_session_maker()()
    with transaction.manager:
        p_add_post = db.query(m.Permission).filter_by(name=P_ADD_POST).one()
        p_vote = db.query(m.Permission).filter_by(name=P_VOTE).one()
        # Only open discussions, i.e. where everyone can read.
        dps = db.query(m.DiscussionPermission).filter_by(
        	permission_id=p_add_post.id)
        for dp in dps:
            db.add(m.DiscussionPermission(
                discussion_id = dp.discussion_id,
                role_id = dp.role_id,
                permission_id = p_vote.id))


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
