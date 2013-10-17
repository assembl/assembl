"""profile in abstract account

Revision ID: 1af8bd2cb75e
Revises: 18585092706e
Create Date: 2013-10-12 10:22:09.031412

"""

# revision identifiers, used by Alembic.
revision = '1af8bd2cb75e'
down_revision = '18585092706e'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl import models as m
from assembl.lib import config

db = m.DBSession


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('abstract_agent_account',
            sa.Column(
                'profile_id',
                sa.Integer,
                sa.ForeignKey('agent_profile.id', ondelete='CASCADE')))
        op.execute(
            '''UPDATE abstract_agent_account SET profile_id=(
                SELECT profile_id FROM agent_email_account 
                    WHERE agent_email_account.id = abstract_agent_account.id)
                WHERE "type" = 'agent_email_account' ''')
        op.execute('''UPDATE abstract_agent_account 
                SET type = 'idprovider_agent_account'
                WHERE type = 'idprovider_account' ''')
        op.execute(
            '''UPDATE abstract_agent_account SET profile_id=(
                SELECT profile_id FROM idprovider_agent_account 
                    WHERE idprovider_agent_account.id = abstract_agent_account.id)
                WHERE "type" = 'idprovider_agent_account' ''')
        op.drop_column('idprovider_agent_account', 'profile_id')
        op.drop_column('agent_email_account', 'profile_id')
        op.alter_column('abstract_agent_account', 'profile_id', nullable=False)

    # Do stuff with the app's models here.
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('idprovider_agent_account',
            sa.Column(
                'profile_id',
                sa.Integer,
                sa.ForeignKey('agent_profile.id', ondelete='CASCADE')))
        op.add_column('agent_email_account',
            sa.Column(
                'profile_id',
                sa.Integer,
                sa.ForeignKey('agent_profile.id', ondelete='CASCADE')))
        op.execute(
            '''UPDATE agent_email_account SET profile_id=(
                SELECT profile_id FROM abstract_agent_account 
                    WHERE agent_email_account.id = abstract_agent_account.id)''')
        op.execute(
            '''UPDATE idprovider_agent_account SET profile_id=(
                SELECT profile_id FROM abstract_agent_account 
                    WHERE idprovider_agent_account.id = abstract_agent_account.id)''')
        op.drop_column('abstract_agent_account', 'profile_id')
        op.alter_column('idprovider_agent_account', 'profile_id', nullable=False)
        op.alter_column('agent_email_account', 'profile_id', nullable=False)

