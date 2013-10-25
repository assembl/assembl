"""username in a separate table

Revision ID: 18585092706e
Revises: 16375b22bb0f
Create Date: 2013-10-12 09:23:47.001937

"""

# revision identifiers, used by Alembic.
revision = '18585092706e'
down_revision = '16375b22bb0f'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl import models as m
from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'username',
            sa.Column('user_id', sa.Integer,
                      sa.ForeignKey('user.id', ondelete='CASCADE'),
                      unique=True),
            sa.Column('username', sa.Unicode(20), primary_key=True)
        )
        op.execute(
            '''INSERT INTO username
                    SELECT id, username FROM "user" WHERE username IS NOT NULL''')
        op.drop_column('user', 'username')

    # Do stuff with the app's models here.
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('user', sa.Column('username', sa.Unicode(20), unique=True))
        op.execute(
            '''UPDATE "user" SET username=(
                SELECT username FROM username WHERE user_id = id)
                WHERE id IN (SELECT user_id FROM username)''')
        op.drop_table('username')
