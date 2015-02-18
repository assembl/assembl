"""discussion auto subscribe on signup

Revision ID: 3e12427ba98d
Revises: 2e75c694f2d9
Create Date: 2015-02-12 15:07:57.238728

"""

# revision identifiers, used by Alembic.
revision = '3e12427ba98d'
down_revision = '2e75c694f2d9'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
    	# (I copied remarks from @maparent for reference) Is it me, or is virtuoso getting stupider?
        # It used to be possible to do the CHECK at the same time, like this:
        # op.add_column(
            # 'discussion',
            # sa.Column('subscribe_to_notifications_on_signup', sa.BOOLEAN, server_default='0'))
        # Now doing it in two phases.
        op.add_column(
            'discussion',
            sa.Column('subscribe_to_notifications_on_signup', sa.SmallInteger, server_default='0'))
        op.execute('UPDATE discussion set subscribe_to_notifications_on_signup = 0')
        op.execute('ALTER TABLE discussion ADD CHECK (subscribe_to_notifications_on_signup IN (0, 1))')

def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('discussion', 'subscribe_to_notifications_on_signup')
