"""deduplicate subscriptions

Revision ID: 5a0ce18bf2b2
Revises: bb43cdb36f5
Create Date: 2015-01-02 18:07:56.658501

"""

# revision identifiers, used by Alembic.
revision = '5a0ce18bf2b2'
down_revision = 'bb43cdb36f5'

from itertools import chain, groupby

import transaction
from alembic import context


def notification_key(notif):
    from assembl.models.notification import (
        NotificationSubscriptionOnPost,
        NotificationSubscriptionOnIdea, NotificationSubscriptionOnExtract,
        NotificationSubscriptionOnUserAccount)
    key = (notif.discussion_id, notif.user_id,
           notif.parent_subscription_id, notif.type)
    if isinstance(notif, NotificationSubscriptionOnPost):
        key = tuple(chain(key, (notif.post_id, )))
    elif isinstance(notif, NotificationSubscriptionOnIdea):
        key = tuple(chain(key, (notif.idea_id, )))
    elif isinstance(notif, NotificationSubscriptionOnExtract):
        key = tuple(chain(key, (notif.extract_id, )))
    elif isinstance(notif, NotificationSubscriptionOnUserAccount):
        key = tuple(chain(key, (notif.on_user_id, )))
    return key


def upgrade(pyramid_env):
    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        subs = db.query(m.NotificationSubscription).all()
        subs.sort(key=notification_key)
        groups = groupby(subs, notification_key)
        todelete = set()
        for key, group in groups:
            group = list(group)
            if len(group) > 1:
                # duplicate subscriptions
                group.sort(key=lambda sub: sub.id)
                base = group.pop(0)
                ids = [sub.id for sub in group]
                todelete.update(ids)
                db.query(m.Notification).filter(
                    m.Notification.first_matching_subscription_id.in_(ids)
                ).update(dict(first_matching_subscription_id=base.id), 'fetch')
        if todelete:
            db.query(m.NotificationSubscription).filter(
                m.NotificationSubscription.id.in_(todelete)).delete('fetch')


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
