"""Notifications classes

Revision ID: 5592fcf1c810
Revises: 19db6b12a1e9
Create Date: 2014-11-03 16:04:04.108141

"""

# revision identifiers, used by Alembic.
revision = '5592fcf1c810'
down_revision = '19db6b12a1e9'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    schema = config.get('db_schema')+"."+config.get('db_user')
    with context.begin_transaction():
        from assembl.models.notification import *
        #No one should have active notifications yet
        op.execute(
            '''DELETE FROM notification''')
        op.add_column('notification',
            sa.Column('sqla_type',
                      String,
                      nullable=False,
                      index=True))
        op.create_table('notification_on_post',
            sa.Column('id',
                       sa.Integer,
                       sa.ForeignKey(
                            'notification.id',
                             ondelete="CASCADE",
                             onupdate="CASCADE"),
                      primary_key=True),
            sa.Column('post_id',
                       sa.Integer,
                       sa.ForeignKey(
                            'post.id',
                             ondelete="CASCADE",
                             onupdate="CASCADE"),
                nullable=False),
            )
        op.drop_column('notification', 'event_source_type')
        op.drop_column('notification', 'event_source_object_id')


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('notification_on_post')
