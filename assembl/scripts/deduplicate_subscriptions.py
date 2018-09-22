"""Workaround for a bug that created duplicate subscriptions"""
from itertools import chain, groupby


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


def deduplicate(db):
    from assembl import models as m
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

if __name__ == '__main__':
    from sys import argv

    from pyramid.paster import get_appsettings, bootstrap
    import transaction

    from assembl.lib.sqla import configure_engine
    from assembl.lib.zmqlib import configure_zmq
    from assembl.indexing.changes import configure_indexing
    from assembl.lib.model_watcher import configure_model_watcher
    from assembl.lib.config import set_config

    conf = argv[-1] or 'local.ini'
    env = bootstrap(conf)
    settings = get_appsettings(conf, 'assembl')
    set_config(settings)
    configure_zmq(settings['changes_socket'], False)
    configure_indexing()
    configure_model_watcher(env['registry'], 'assembl')
    engine = configure_engine(settings, True)
    from assembl import models as m
    with transaction.manager:
        db = m.get_session_maker()()
        deduplicate(db)
