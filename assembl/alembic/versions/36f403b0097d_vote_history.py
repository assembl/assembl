"""vote history

Revision ID: 36f403b0097d
Revises: 46e13114e7d4
Create Date: 2014-06-13 12:05:59.248349

"""

# revision identifiers, used by Alembic.
revision = '36f403b0097d'
down_revision = '46e13114e7d4'

from alembic import context, op
import sqlalchemy as sa
import transaction

from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'idea_vote',
            sa.Column('vote_date', sa.DateTime, nullable=False))
        op.add_column(
            'idea_vote',
            sa.Column('is_tombstone', sa.Boolean, server_default='0'))
        op.execute("UPDATE idea_vote set vote_date = CURRENT_TIMESTAMP")


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('idea_vote', 'vote_date')
        op.drop_column('idea_vote', 'is_tombstone')
