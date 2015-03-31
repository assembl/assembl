"""idprovider_account_uniqueness

Revision ID: 2c22018cd788
Revises: 522dae49e62e
Create Date: 2015-03-31 12:09:06.944502

"""

# revision identifiers, used by Alembic.
revision = '2c22018cd788'
down_revision = '522dae49e62e'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('idprovider_agent_account',
                      sa.Column('temp_userid', sa.String(200)))
        op.execute('UPDATE idprovider_agent_account SET temp_userid = userid')
        op.drop_column('idprovider_agent_account', 'userid')
        op.add_column('idprovider_agent_account',
                      sa.Column('userid', sa.String(200), nullable=False))
        op.execute('UPDATE idprovider_agent_account \
                    SET userid = temp_userid' )
        op.drop_column('idprovider_agent_account', 'temp_userid')

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('idprovider_agent_account',
                      sa.Column('temp_userid', sa.String(200)))
        op.execute('UPDATE idprovider_agent_account SET temp_userid = userid')
        op.drop_column('idprovider_agent_account', 'userid')
        op.add_column('idprovider_agent_account',
                      sa.Column('userid', sa.String(200)))
        op.execute('UPDATE idprovider_agent_account \
                    SET userid = temp_userid' )
        op.drop_column('idprovider_agent_account', 'temp_userid')
