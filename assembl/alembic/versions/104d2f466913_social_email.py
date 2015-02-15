"""social email

Revision ID: 104d2f466913
Revises: 45cf6094ba3d
Create Date: 2015-02-14 10:36:09.826301

"""

# revision identifiers, used by Alembic.
revision = '104d2f466913'
down_revision = '45cf6094ba3d'

from alembic import context, op
import sqlalchemy as sa
from sqlalchemy.orm.attributes import flag_modified
import transaction


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'abstract_agent_account',
            sa.Column("verified", sa.SmallInteger,
                      default=False, server_default='0'))
        op.add_column(
            'abstract_agent_account',
            sa.Column('email', sa.String(100), index=True))

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()

    with transaction.manager:
        # Start with a blanket 0
        db.execute("UPDATE abstract_agent_account SET verified=0")
        # get from previous values
        db.execute("""UPDATE abstract_agent_account SET email=(
                SELECT agent_email_account.email
                FROM agent_email_account
                WHERE abstract_agent_account.id = agent_email_account.id)
            WHERE abstract_agent_account."type" = 'agent_email_account'""")
        db.execute("""UPDATE abstract_agent_account SET verified=(
                SELECT agent_email_account.verified
                FROM agent_email_account
                WHERE abstract_agent_account.id = agent_email_account.id)
            WHERE abstract_agent_account."type" = 'agent_email_account'""")
        db.execute("""UPDATE abstract_agent_account SET verified=(
                SELECT identity_provider.trust_emails
                FROM identity_provider
                JOIN idprovider_agent_account ON (
                    idprovider_agent_account.provider_id = identity_provider.id)
                WHERE abstract_agent_account.id = idprovider_agent_account.id)
            WHERE abstract_agent_account."type" = 'idprovider_agent_account'""")
        db.flush()
        ipaccounts = db.query(m.IdentityProviderAccount).all()
        for ipaccount in ipaccounts:
            ipaccount.interpret_profile()
            if ipaccount.email:
                email_accounts = db.query(m.EmailAccount).filter_by(
                    email=ipaccount.email).all()
                for email_account in email_accounts:
                    if email_account.profile == ipaccount.profile:
                        ipaccount.verified |= email_account.verified
                        db.delete(email_account)
                    elif ipaccount.verified and not email_account.verified:
                        db.delete(email_account)
                    else:
                        # I checked that this case did not happen
                        # in our existing databases
                        ipaccount.profile.merge(email_account.profile)

    with context.begin_transaction():
        db.execute('ALTER TABLE abstract_agent_account ADD CHECK (verified IN (0, 1))')
        op.drop_table('agent_email_account')


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'agent_email_account',
            sa.Column('id', sa.Integer, sa.ForeignKey(
                'abstract_agent_account.id', ondelete='CASCADE',
                onupdate='CASCADE'),
                primary_key=True),
            sa.Column('email', sa.String(100), nullable=False, index=True),
            sa.Column('verified', sa.SmallInteger(), server_default='0'),
            sa.Column('active', sa.Boolean(), server_default='1'))
    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()

    with transaction.manager:
        # get from previous values
        db.execute("""INSERT INTO agent_email_account (id, email, verified)
            SELECT abstract_agent_account.id,
                   abstract_agent_account.email,
                   abstract_agent_account.verified
            FROM abstract_agent_account
            WHERE abstract_agent_account.email IS NOT NULL
            AND abstract_agent_account."type" = 'agent_email_account'""")
        ipaccounts = db.query(m.IdentityProviderAccount).all()
        for ipaccount in ipaccounts:
            ipaccount.interpret_profile()
            if ipaccount.email:
                db.add(m.EmailAccount(
                    email=ipaccount.email, profile_id=ipaccount.profile_id,
                    verified=ipaccount.verified, preferred=ipaccount.preferred))
                email_accounts = db.query(m.EmailAccount).filter_by(
                    email=ipaccount.email).all()
                for email_account in email_accounts:
                    if email_account.profile == ipaccount.profile:
                        ipaccount.verified |= email_account.verified
                        db.delete(email_account)
                    elif ipaccount.verified and not email_account.verified:
                        db.delete(email_account)
                    else:
                        # I checked that this case did not happen
                        # in our existing databases
                        ipaccount.profile.merge(email_account.profile)

    with context.begin_transaction():
        db.execute(
            "ALTER TABLE agent_email_account ADD CHECK (verified IN (0, 1))")
        op.drop_column(
            'abstract_agent_account', "verified")
        op.drop_index('ix_abstract_agent_account_email')
        op.drop_column('abstract_agent_account', "email")
