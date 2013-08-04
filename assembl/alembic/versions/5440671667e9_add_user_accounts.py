"""add user accounts

Revision ID: 5440671667e9
Revises: 1f236361ce82
Create Date: 2013-07-26 16:40:50.638678

"""

# revision identifiers, used by Alembic.
revision = '5440671667e9'
down_revision = '1f236361ce82'

from alembic import context, op
import sqlalchemy as sa
import transaction

from datetime import datetime

from assembl import models as m

db = m.DBSession


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'agent_profile',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('name', sa.Unicode(1024)),
            sa.Column('type', sa.String(60)))
        op.create_table(
            'email_account',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('email', sa.String(100), index=True, nullable=False),
            sa.Column('verified', sa.Boolean, default=False),
            sa.Column('preferred', sa.Boolean, default=False),
            sa.Column('active', sa.Boolean, default=True),
            sa.Column(
                'profile_id', sa.Integer,
                sa.ForeignKey('agent_profile.id', ondelete='CASCADE'),
                nullable=False, index=True))
        op.create_table(
            'identity_provider',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('provider_type', sa.String(20), nullable=False),
            sa.Column('name', sa.String(60), nullable=False),
            sa.Column('trust_emails', sa.Boolean, default=False))
        op.create_table(
            'idprovider_account',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column(
                'provider_id', sa.Integer,
                sa.ForeignKey('identity_provider.id', ondelete='CASCADE'),
                nullable=False),
            sa.Column(
                'profile_id', sa.Integer,
                sa.ForeignKey('agent_profile.id', ondelete='CASCADE'),
                nullable=False),
            sa.Column('username', sa.String(200)),
            sa.Column('domain', sa.String(200)),
            sa.Column('userid', sa.String(200)))
        op.create_table(
            'idprovider_email',
            sa.Column(
                'email', sa.String(100), nullable=False, primary_key=True),
            sa.Column('verified', sa.Boolean(), default=False),
            sa.Column('preferred', sa.Boolean(), default=False),
            sa.Column('active', sa.Boolean(), default=True),
            sa.Column(
                'idprovider_account_id', sa.Integer,
                sa.ForeignKey('idprovider_account.id', ondelete='CASCADE'),
                nullable=False, primary_key=True))
        op.create_table(
            'user',
            sa.Column(
                'id', sa.Integer,
                sa.ForeignKey('agent_profile.id', ondelete='CASCADE'),
                primary_key=True),
            sa.Column('username', sa.Unicode(20), unique=True),
            sa.Column('preferred_email', sa.Unicode(50)),
            sa.Column('verified', sa.Boolean, default=False),
            sa.Column('password', sa.Unicode(115)),
            sa.Column('timezone', sa.Time(True)),
            sa.Column('last_login', sa.DateTime),
            sa.Column('login_failures', sa.Integer(4), default=0),
            sa.Column(
                'creation_date', sa.DateTime, nullable=False,
                default=datetime.utcnow))
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
        op.drop_table('user')
        op.drop_table('idprovider_email')
        op.drop_table('idprovider_account')
        op.drop_table('identity_provider')
        op.drop_table('email_account')
        op.drop_table('agent_profile')
