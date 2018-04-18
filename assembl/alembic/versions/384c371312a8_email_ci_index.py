"""email_ci_index

Revision ID: 384c371312a8
Revises: 267b2f56d7b0
Create Date: 2016-05-12 16:10:43.483856

"""

# revision identifiers, used by Alembic.
revision = '384c371312a8'
down_revision = '267b2f56d7b0'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
        with context.begin_transaction():
            op.drop_index(
                'ix_public_abstract_agent_account_email',
                'abstract_agent_account')
            op.create_index(
                'ix_public_abstract_agent_account_email_ci',
                'abstract_agent_account', [sa.text('lower(email)')], unique=False)


def downgrade(pyramid_env):
        with context.begin_transaction():
            op.drop_index(
                'ix_public_abstract_agent_account_email_ci',
                'abstract_agent_account')
            op.create_index(
                'ix_public_abstract_agent_account_email',
                'abstract_agent_account', ['email'], unique=False)
