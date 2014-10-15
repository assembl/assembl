"""NotificationSubscription subclasses

Revision ID: 4bff86bd0ef4
Revises: 238823d75893
Create Date: 2014-10-15 11:09:26.718459

"""

# revision identifiers, used by Alembic.
revision = '4bff86bd0ef4'
down_revision = '238823d75893'

from alembic import context, op
import sqlalchemy as sa
import transaction

from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('notification_subscription', 'followed_object_id')
        op.create_table(
            'notification_subscription_on_post',
            sa.Column('id', sa.Integer, sa.ForeignKey(
                'notification_subscription.id'), primary_key=True),
            sa.Column('post_id', sa.Integer, sa.ForeignKey(
                'post.id')))
        op.create_table(
            'notification_subscription_on_idea',
            sa.Column('id', sa.Integer, sa.ForeignKey(
                'notification_subscription.id'), primary_key=True),
            sa.Column('idea_id', sa.Integer, sa.ForeignKey(
                'idea.id')))
        op.create_table(
            'notification_subscription_on_extract',
            sa.Column('id', sa.Integer, sa.ForeignKey(
                'notification_subscription.id'), primary_key=True),
            sa.Column('extract_id', sa.Integer, sa.ForeignKey(
                'extract.id')))
        op.create_table(
            'notification_subscription_on_useraccount',
            sa.Column('id', sa.Integer, sa.ForeignKey(
                'notification_subscription.id'), primary_key=True),
            sa.Column('user_id', sa.Integer, sa.ForeignKey(
                'user.id')))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('notification_subscription_on_post')
        op.drop_table('notification_subscription_on_idea')
        op.drop_table('notification_subscription_on_extract')
        op.drop_table('notification_subscription_on_useraccount')
        op.add_column('notification_subscription',
            sa.Column('followed_object_id', sa.Integer))
