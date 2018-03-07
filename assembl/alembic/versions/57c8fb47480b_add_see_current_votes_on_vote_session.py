"""Add see_current_votes on vote_session

Revision ID: 57c8fb47480b
Revises: b263034c0106
Create Date: 2018-03-07 18:13:27.694662

"""

# revision identifiers, used by Alembic.
revision = '57c8fb47480b'
down_revision = 'b263034c0106'

from alembic import context, op
import sqlalchemy as sa


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'vote_session',
            sa.Column(
                'see_current_votes',
                sa.Boolean,
                nullable=False,
                server_default='0',
                default=False
            )
        )


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('vote_session', 'see_current_votes')
