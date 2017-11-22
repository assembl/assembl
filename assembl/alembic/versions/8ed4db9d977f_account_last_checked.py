"""account last_checked

Revision ID: 8ed4db9d977f
Revises: 27f58fce7b77
Create Date: 2017-11-22 08:45:22.805166

"""

# revision identifiers, used by Alembic.
revision = '8ed4db9d977f'
down_revision = '27f58fce7b77'

from alembic import context, op
import sqlalchemy as sa


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            "user",
            sa.Column("last_assembl_login", sa.DateTime))
        op.add_column(
            "social_auth_account",
            sa.Column("last_checked", sa.DateTime))
        op.execute('UPDATE public.user SET last_assembl_login = last_login')
        # set last_checked from last_login when single account
        op.execute('''
            UPDATE social_auth_account SET last_checked = (
                SELECT last_login FROM public.user
                    JOIN abstract_agent_account ON public.user.id = abstract_agent_account.profile_id
                    WHERE abstract_agent_account.id = social_auth_account.id)
            WHERE id IN (
                SELECT min(abstract_agent_account.id)
                FROM abstract_agent_account
                JOIN public.user ON (public.user.id = abstract_agent_account.profile_id)
                WHERE abstract_agent_account.verified
                GROUP BY profile_id
                HAVING count(abstract_agent_account.id) = 1
                    AND min(abstract_agent_account.type)='social_auth_account')''')


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column(
            "social_auth_account", "last_checked")
        op.drop_column(
            "user", "last_assembl_login")
