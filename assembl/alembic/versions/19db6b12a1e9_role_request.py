"""role request

Revision ID: 19db6b12a1e9
Revises: 499dcb6474f8
Create Date: 2014-10-31 17:13:47.680948

"""

# revision identifiers, used by Alembic.
revision = '19db6b12a1e9'
down_revision = '499dcb6474f8'

from alembic import context, op
import sqlalchemy as sa


def upgrade(pyramid_env):
    with context.begin_transaction():
        # Is it me, or is virtuoso getting stupider?
        # It used to be possible to do the CHECK at the same time, like this:
        # op.add_column(
            # 'local_user_role',
            # sa.Column('requested', sa.BOOLEAN, server_default='0'))
        # Now doing it in two phases.
        op.add_column(
            'local_user_role',
            sa.Column('requested', sa.SmallInteger, server_default='0'))
        op.execute('UPDATE local_user_role set requested = 0')
        op.execute('ALTER TABLE local_user_role ADD CHECK (requested IN (0, 1))')


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('local_user_role', 'requested')
