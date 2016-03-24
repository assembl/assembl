"""social_auth tables

Revision ID: 56eda83b3116
Revises: 11d73c586596
Create Date: 2016-02-12 08:15:21.194178

"""

# revision identifiers, used by Alembic.
revision = '56eda83b3116'
down_revision = '11d73c586596'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'social_auth_nonce',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('server_url', sa.String(255)),
            sa.Column('timestamp', sa.Integer),
            sa.Column('salt', sa.String(40)),
            sa.schema.UniqueConstraint('server_url', 'timestamp', 'salt'))
        op.create_table(
            'social_auth_code',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('email', sa.String(200)),
            sa.Column('code', sa.String(32)),  # index = True
            sa.schema.UniqueConstraint('code', 'email'))
        op.create_index(
            '%s_%s_ix_social_auth_code_code' % (
                config.get('db_schema'), config.get('db_user')),
            'social_auth_code', ['code'], unique=False)
        op.create_table(
            'social_auth_association',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('server_url', sa.String(255)),
            sa.Column('handle', sa.String(255)),
            sa.Column('secret', sa.String(255)),
            sa.Column('issued', sa.Integer),
            sa.Column('lifetime', sa.Integer),
            sa.Column('assoc_type', sa.String(64)),
            sa.schema.UniqueConstraint('server_url', 'handle'))
        op.create_table(
            "social_auth_account",
            sa.Column("id", sa.Integer, sa.ForeignKey(
                'abstract_agent_account.id', ondelete='CASCADE',
                onupdate='CASCADE'), primary_key=True),
            sa.Column("provider_id", sa.Integer, sa.ForeignKey(
                'identity_provider.id', ondelete='CASCADE',
                onupdate='CASCADE'), nullable=False),
            sa.Column("username", sa.String(200)),
            sa.Column("domain", sa.String(200)),
            sa.Column("uid", sa.String(255), nullable=False),
            sa.Column("extra_data", sa.Text),
            sa.Column("picture_url", sa.String),
            sa.UniqueConstraint('provider_id', 'uid'))
    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_index("%s_%s_ix_social_auth_code_code" % (
                config.get('db_schema'), config.get('db_user')),
            "social_auth_code")
        op.drop_constraint(
            "%s_%s_social_auth_nonce_UNQC_server_url_timestamp_salt" % (
                config.get('db_schema'), config.get('db_user')),
            "social_auth_nonce")
        op.drop_constraint(
            "%s_%s_social_auth_code_UNQC_code_email" % (
                config.get('db_schema'), config.get('db_user')),
            "social_auth_code")
        op.drop_constraint(
            "%s_%s_social_auth_association_UNQC_server_url_handle" % (
                config.get('db_schema'), config.get('db_user')),
            "social_auth_association")
        op.drop_constraint(
            "%s_%s_social_auth_account_UNQC_provider_id_uid" % (
                config.get('db_schema'), config.get('db_user')),
            "social_auth_account")
        op.drop_table('social_auth_nonce')
        op.drop_table('social_auth_code')
        op.drop_table('social_auth_association')
        op.drop_table('social_auth_account')
        op.execute("DELETE FROM abstract_agent_account"
                   " WHERE type = 'social_auth_account'")
