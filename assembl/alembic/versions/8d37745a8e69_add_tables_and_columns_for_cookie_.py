"""Add tables and columns for cookie_storage

Revision ID: 8d37745a8e69
Revises: 2d0777b24f0d
Create Date: 2018-07-19 19:07:59.770479

"""

# revision identifiers, used by Alembic.
revision = '8d37745a8e69'
down_revision = '2d0777b24f0d'

from alembic import context, op
import sqlalchemy as sa
import transaction

from datetime import datetime
from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
    	op.add_column('agent_status_in_discussion', sa.Column("accepted_cookies", sa.Text()))
        op.add_column('user', sa.Column("last_accepted_cgu_date",sa.DateTime, default=None))
        op.add_column('user', sa.Column("last_accepted_privacy_policy_date", sa.DateTime, default=None))
        op.create_table(
            "action_on_discussion",
            sa.Column("id", sa.Integer, sa.ForeignKey('action.id', ondelete="CASCADE", onupdate='CASCADE'),
                primary_key=True),
            sa.Column("discussion_id", sa.Integer, sa.ForeignKey('discussion.id', ondelete="CASCADE", onupdate="CASCADE"),
            nullable=False, index=True)
            )

def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('agent_status_in_discussion', 'accepted_cookies')
        op.drop_column('user', "last_accepted_cgu_date")
        op.drop_column('user', "last_accepted_privacy_policy_date")
        op.drop_table('action_on_discussion')
