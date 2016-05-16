"""unicode social username

Revision ID: 1bbe7758d93e
Revises: 14296672081d
Create Date: 2016-05-16 06:53:53.204274

"""

# revision identifiers, used by Alembic.
revision = '1bbe7758d93e'
down_revision = '14296672081d'

from alembic import context, op
import sqlalchemy as sa
import transaction

from assembl.lib import config
from assembl.lib.sqla import mark_changed, using_virtuoso


def upgrade(pyramid_env):
    if using_virtuoso():
        with context.begin_transaction():
            op.create_table('social_auth_account_temp',
                sa.Column('id', sa.Integer, primary_key=True),
                sa.Column('username', sa.Unicode(200)))
            # Do stuff with the app's models here.
        from assembl import models as m
        db = m.get_session_maker()()
        with transaction.manager:
            db.execute("""INSERT INTO social_auth_account_temp
                       SELECT id, username FROM social_auth_account
                       WHERE username IS NOT NULL""")
            mark_changed()
        with context.begin_transaction():
            op.drop_column('social_auth_account', 'username')
            op.add_column(
                'social_auth_account', sa.Column('username', sa.Unicode(200)))
        with transaction.manager:
            db.execute("""UPDATE social_auth_account
                       SET username = (
                       SELECT username FROM social_auth_account_temp
                       WHERE social_auth_account_temp.id = social_auth_account.id)""")
            mark_changed()
        with context.begin_transaction():
            op.drop_table('social_auth_account_temp')
    else:
        with context.begin_transaction():
            op.alter_column('social_auth_account', 'username', type_=sa.Unicode(200))



def downgrade(pyramid_env):
    if using_virtuoso():
        with context.begin_transaction():
            op.create_table('social_auth_account_temp',
                sa.Column('id', sa.Integer, primary_key=True),
                sa.Column('username', sa.String(200)))
            # Do stuff with the app's models here.
        from assembl import models as m
        db = m.get_session_maker()()
        with transaction.manager:
            db.execute("""INSERT INTO social_auth_account_temp
                       SELECT id, username FROM social_auth_account
                       WHERE username IS NOT NULL""")
            mark_changed()
        with context.begin_transaction():
            op.drop_column('social_auth_account', 'username')
            op.add_column(
                'social_auth_account', sa.Column('username', sa.String(200)))
        with transaction.manager:
            db.execute("""UPDATE social_auth_account
                       SET username = (
                       SELECT username FROM social_auth_account_temp
                       WHERE social_auth_account_temp.id = social_auth_account.id)""")
            mark_changed()
        with context.begin_transaction():
            op.drop_table('social_auth_account_temp')
    else:
        with context.begin_transaction():
            op.alter_column('social_auth_account', 'username', type_=sa.Unicode(200))
