"""kill weird notifications

Revision ID: 29c5ef7ad189
Revises: 236808a19c3b
Create Date: 2015-01-09 15:22:47.175481

"""

# revision identifiers, used by Alembic.
revision = '29c5ef7ad189'
down_revision = '236808a19c3b'

import transaction


def upgrade(pyramid_env):
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        db.query(m.Notification).filter(m.Notification.id.in_(
            db.query(m.NotificationOnPost.id).join(
                m.NotificationSubscription).join(
                m.Post, m.Post.id == m.NotificationOnPost.post_id).filter(
                m.Post.discussion_id != m.NotificationSubscription.discussion_id
                ))).delete(False)


def downgrade(pyramid_env):
    pass
