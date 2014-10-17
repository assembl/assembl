"""Repair NotificationSubscriptionOnUserAccount

Revision ID: 1fdfec5c3fe9
Revises: 3546c3f3020b
Create Date: 2014-10-17 02:44:00.119346

"""

# revision identifiers, used by Alembic.
revision = '1fdfec5c3fe9'
down_revision = '3546c3f3020b'

from alembic import context, op
import sqlalchemy as sa


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'notification_subscription_on_useraccount',
            sa.Column('on_user_id', sa.Integer, sa.ForeignKey(
                "user.id", ondelete='CASCADE', onupdate='CASCADE')))
        op.execute(
            '''UPDATE notification_subscription_on_useraccount
            SET on_user_id = user_id''')
        op.drop_column('notification_subscription_on_useraccount', 'user_id')


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'notification_subscription_on_useraccount',
            sa.Column('user_id', sa.Integer, sa.ForeignKey(
                "user.id", ondelete='CASCADE', onupdate='CASCADE')))
        op.execute(
            '''UPDATE notification_subscription_on_useraccount
            SET user_id = on_user_id''')
        op.drop_column(
            'notification_subscription_on_useraccount', 'on_user_id')
