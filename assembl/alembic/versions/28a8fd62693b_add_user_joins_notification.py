"""add user_joins notification

Revision ID: 28a8fd62693b
Revises: 29f0f6751c2a
Create Date: 2015-07-20 09:24:46.797531

"""

# revision identifiers, used by Alembic.
revision = '28a8fd62693b'
down_revision = '29f0f6751c2a'

from alembic import context, op
import sqlalchemy as sa
from  sqlalchemy.schema import CheckConstraint
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
