"""last_login and subscriptions

Revision ID: 632623e9685d
Revises: 53d7278b1ac3
Create Date: 2016-05-27 05:05:37.263333

"""

# revision identifiers, used by Alembic.
revision = '632623e9685d'
down_revision = '53d7278b1ac3'

from datetime import datetime
from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config
from assembl.lib.sqla import mark_changed


def merge_min_max(mmdict, mmquery):
    for (profile_id, discussion_id, first_date, last_date) in mmquery:
        if (profile_id, discussion_id) in mmdict:
            p = mmdict[(profile_id, discussion_id)]
            p[0] = min(p[0], first_date)
            p[1] = max(p[1], last_date)
        else:
            mmdict[(profile_id, discussion_id)] = [first_date, last_date]
    return mmdict



def upgrade(pyramid_env):
    from assembl import models as m
    db = m.get_session_maker()()
    # Add AgentStatusInDiscussion for users who have acted on Assembl
    with transaction.manager:
        q1 = db.query(m.User.id
            ).outerjoin(m.AgentStatusInDiscussion
            ).filter(m.AgentStatusInDiscussion.id == None,
                     (m.User.last_login == m.User.creation_date) |
                     (m.User.last_login == None)).subquery()
        # look at actions on posts
        q2 = db.query(
            m.User.id, m.Post.discussion_id,
            sa.func.min(m.ActionOnPost.creation_date),
            sa.func.max(m.ActionOnPost.creation_date)
            ).join(m.ActionOnPost
            ).join(m.Post
            ).filter(m.User.id.in_(q1)
            ).group_by(m.User.id, m.Post.discussion_id)
        min_maxes = {
            (profile_id, discussion_id): [first_action_date, last_action_date]
            for (profile_id, discussion_id, first_action_date, last_action_date) in q2
        }

        # look at assembl posts
        q3 = db.query(
            m.User.id, m.AssemblPost.discussion_id,
            sa.func.min(m.AssemblPost.creation_date),
            sa.func.max(m.AssemblPost.creation_date)
            ).join(m.AssemblPost, m.AssemblPost.creator_id == m.User.id
            ).filter(m.User.id.in_(q1)
            ).group_by(m.User.id, m.AssemblPost.discussion_id)
        merge_min_max(min_maxes, q3)
        # look at requested subscriptions
        q9 = db.query(
            m.User.id, m.NotificationSubscription.discussion_id,
            sa.func.min(m.NotificationSubscription.creation_date),
            sa.func.max(m.NotificationSubscription.last_status_change_date)
            ).join(m.NotificationSubscription, m.NotificationSubscription.user_id == m.User.id
            ).filter(
                m.User.id.in_(q1),
                m.NotificationSubscription.creation_origin ==
                m.NotificationCreationOrigin.USER_REQUESTED
            ).group_by(m.User.id, m.NotificationSubscription.discussion_id)
        merge_min_max(min_maxes, q9)
        # create AgentStatusInDiscussion
        for ((profile_id, discussion_id), (first_date, last_date)
                ) in min_maxes.items():
            db.add(m.AgentStatusInDiscussion(
                profile_id=profile_id, discussion_id=discussion_id,
                first_visit=first_date, last_visit=last_date,
                first_subscribed=first_date))
        # save those that we have just updated for next step
        known_logged_in = {
            profile_id for ((profile_id, discussion_id), (first_date, last_date))
                in min_maxes.items() if first_date == last_date}

    # Clear last_login for non-social users without m.AgentStatusInDiscussion,
    # or where for all m.AgentStatusInDiscussion, last_visit == first_subscribed
    with transaction.manager:
        q4 = db.query(m.User.id
            ).outerjoin(m.Action
            ).outerjoin(m.SocialAuthAccount
            ).outerjoin(m.AssemblPost, m.AssemblPost.creator_id == m.User.id
            ).filter(
                m.Action.id == None, m.SocialAuthAccount.id == None,
                m.AssemblPost.id == None,
                m.User.last_login == m.User.creation_date)

        q5 = q4.outerjoin(m.AgentStatusInDiscussion
            ).filter(m.AgentStatusInDiscussion.id == None).subquery()
        db.query(m.User).filter(m.User.id.in_(q5)
            ).update({m.User.last_login: None}, synchronize_session=False)

        q6 = q4.filter(
            m.User.id.notin_(known_logged_in)
            ).join(m.AgentStatusInDiscussion
            ).group_by(m.User.id
            ).having(sa.func.max(m.AgentStatusInDiscussion.first_subscribed) ==
                     sa.func.min(m.AgentStatusInDiscussion.last_visit)
            ).subquery()
        db.query(m.User).filter(m.User.id.in_(q6)
            ).update({m.User.last_login: None}, synchronize_session=False)
        mark_changed()

    # Update missing last_logins from AgentStatusInDiscussion
    with transaction.manager:
        dates = db.query(m.User.id, sa.func.max(m.AgentStatusInDiscussion.last_visit)
            ).join(m.AgentStatusInDiscussion
            ).filter(m.User.last_login == None,
            m.AgentStatusInDiscussion.last_visit != None
            ).group_by(m.User.id)
        datesp = [{'uid':id, 'date': d} for (id, d) in dates]
        if datesp:
            ustmt = m.User.__table__.update(
                ).where(m.User.id==sa.bindparam('uid')
                ).values(last_login=sa.bindparam('date'))
            db.execute(ustmt, datesp)
        mark_changed()

    with transaction.manager:
        # There should not be remaining user_actions for loginless users.
        creation_origins = db.query(m.NotificationSubscription.creation_origin
            ).join(m.User, m.User.id==m.NotificationSubscription.user_id
            ).filter(m.User.last_login == None, m.User.type != 'user_template'
            ).distinct().all()
        assert creation_origins == [] or creation_origins == [
            (m.NotificationCreationOrigin.DISCUSSION_DEFAULT,)]

        # Alas, erase history of notifications sent to those hapless users.
        q7 = db.query(m.Notification.id
            ).join(m.NotificationSubscription
            ).join(m.User, m.User.id==m.NotificationSubscription.user_id
            ).filter(m.User.last_login == None, m.User.type != 'user_template')
        db.query(m.Notification).filter(m.Notification.id.in_(q7)
            ).delete(synchronize_session=False)

        # and finally the subscriptions of users who presumably never logged in.
        q8 = db.query(m.NotificationSubscription.id
            ).join(m.User, m.User.id==m.NotificationSubscription.user_id
            ).outerjoin(m.Notification
            ).filter(m.User.last_login == None, m.User.type != 'user_template',
                m.Notification.id == None).subquery()

        db.query(m.NotificationSubscription
            ).filter(m.NotificationSubscription.id.in_(q8)
            ).delete(synchronize_session=False)
        mark_changed()


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
