"""Add content source error notification

Revision ID: 157237dd5620
Revises: 2bd68ba8f420
Create Date: 2015-10-26 11:52:43.681365

"""

# revision identifiers, used by Alembic.
revision = '157237dd5620'
down_revision = '2bd68ba8f420'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    from assembl.models.notification import (
        NotificationSubscription, NotificationSubscriptionClasses)
    with context.begin_transaction():
        tname = "notification_subscription"
        cname = 'ck_%s_%s_%s_notification_subscription_classes' % (
            config.get('db_schema'), config.get('db_user'), tname)
        op.drop_constraint(cname, tname)
        op.create_check_constraint(
            cname, tname, NotificationSubscription.type.in_(
                NotificationSubscriptionClasses.values()))


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
