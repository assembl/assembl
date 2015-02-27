"""userStatusInDiscussion

Revision ID: 3958ac5b0665
Revises: 6138047cb26
Create Date: 2015-02-25 22:38:05.083334

"""

# revision identifiers, used by Alembic.
revision = '3958ac5b0665'
down_revision = '6138047cb26'

from alembic import context, op
import sqlalchemy as sa
import transaction
from datetime import datetime

from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'agent_status_in_discussion',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('discussion_id', sa.Integer, sa.ForeignKey(
                "discussion.id", ondelete='CASCADE', onupdate='CASCADE')),
            sa.Column('profile_id', sa.Integer, sa.ForeignKey(
                "agent_profile.id", ondelete='CASCADE', onupdate='CASCADE')),
            sa.Column('last_visit', sa.DateTime),
            sa.Column('first_visit', sa.DateTime),
            sa.Column('first_subscribed', sa.DateTime),
            sa.Column('last_unsubscribed', sa.DateTime),
            sa.Column('user_created_on_this_discussion', sa.Boolean,
                      server_default='0'),
            sa.schema.UniqueConstraint('discussion_id', 'profile_id')
            )

    # Do stuff with the app's models here.
    from assembl import models as m
    from assembl.auth import R_PARTICIPANT
    db = m.get_session_maker()()
    now = datetime.utcnow()
    with transaction.manager:
        for (user_id, discussion_id) in db.query(
                m.LocalUserRole.user_id, m.LocalUserRole.discussion_id).join(
                m.Role).filter(m.Role.name == R_PARTICIPANT).distinct().all():
            db.add(m.AgentStatusInDiscussion(
                profile_id=user_id, discussion_id=discussion_id,
                first_visit=now, last_visit=now, first_subscribed=now))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('agent_status_in_discussion')
