"""vote_spec.question_id nullable

Revision ID: 165e8b786ca0
Revises: 9565c056759
Create Date: 2015-07-14 11:54:56.171182

"""

# revision identifiers, used by Alembic.
revision = '165e8b786ca0'
down_revision = '9565c056759'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        # No data yet, we will just lose it.
        op.drop_column('vote_specification', 'question_id')
        op.add_column(
            'vote_specification',
            sa.Column('question_id', sa.Integer, nullable=True))

def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('vote_specification', 'question_id')
        op.add_column(
            'vote_specification',
            sa.Column('question_id', sa.Integer, nullable=False))
