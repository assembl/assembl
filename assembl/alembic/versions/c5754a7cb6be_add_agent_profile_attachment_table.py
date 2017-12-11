"""Add agent_profile_attachment table

Revision ID: c5754a7cb6be
Revises: c98a9b6f6b7f
Create Date: 2017-12-06 13:32:59.251003

"""

# revision identifiers, used by Alembic.
revision = 'c5754a7cb6be'
down_revision = 'c98a9b6f6b7f'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'agent_profile_attachment',
            sa.Column(
                'id',
                sa.Integer,
                sa.ForeignKey(
                    'attachment.id',
                    ondelete="CASCADE",
                    onupdate="CASCADE"
                ),
                primary_key=True
            ),
            sa.Column(
                'user_id',
                sa.Integer,
                sa.ForeignKey(
                    'agent_profile.id',
                    ondelete="CASCADE",
                    onupdate="CASCADE"
                ),
                nullable=False,
                index=True
            ),
        )


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('agent_profile_attachment')
