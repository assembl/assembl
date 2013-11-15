"""Proper sqlalchemy polymorphism for the auth module

Revision ID: 1c439fb5654e
Revises: 3fc4f31ea2
Create Date: 2013-09-27 18:30:50.637634

"""

# revision identifiers, used by Alembic.
revision = '1c439fb5654e'
down_revision = '3fc4f31ea2'

from alembic import context, op
import sqlalchemy as sa
import transaction

from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'abstract_agent_account',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('type', sa.String(length=60), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.rename_table(u'email_account', 'agent_email_account')
        op.rename_table(u'idprovider_account', 'idprovider_agent_account')
        op.execute("INSERT INTO abstract_agent_account (SELECT id, 'agent_email_account' FROM agent_email_account)")
        op.execute("UPDATE idprovider_agent_account SET id = id + (SELECT max(id) FROM agent_email_account)")
        op.execute("INSERT INTO abstract_agent_account (SELECT id, 'idprovider_agent_account' FROM idprovider_agent_account)")
        op.execute("select setval('abstract_agent_account_id_seq', (SELECT max(id)+1 FROM abstract_agent_account), false)")
        op.execute("alter table agent_email_account alter column id drop default")
        op.execute("alter table idprovider_agent_account alter column id drop default")
        op.create_foreign_key('fk_id', 'agent_email_account', 'abstract_agent_account', ['id'], ['id'], ondelete='CASCADE')
        op.create_foreign_key('fk_id', 'idprovider_agent_account', 'abstract_agent_account', ['id'], ['id'], ondelete='CASCADE')
        op.execute('drop sequence email_account_id_seq')
        op.execute('drop sequence idprovider_account_id_seq')

        ### end Alembic commands ###

    # Do stuff with the app's models here.
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_constraint('fk_id', 'idprovider_agent_account', 'foreignkey')
        op.drop_constraint('fk_id', 'agent_email_account', 'foreignkey')
        op.drop_table('abstract_agent_account')
        op.rename_table('agent_email_account', 'email_account')
        op.rename_table('idprovider_agent_account', 'idprovider_account')
        op.create_primary_key('email_account_pkey', 'email_account', ['id'])
        op.create_primary_key('idprovider_account_pkey', 'idprovider_account', ['id'])
        # getting the idprovider_account ids back to 1 is not that necessary
