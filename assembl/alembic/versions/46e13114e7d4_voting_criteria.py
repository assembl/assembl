"""voting criteria

Revision ID: 46e13114e7d4
Revises: 2df4150af427
Create Date: 2014-06-11 08:00:14.063361

"""

# revision identifiers, used by Alembic.
revision = '46e13114e7d4'
down_revision = '2df4150af427'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('idea_vote',
            sa.Column(
                'criterion_id', sa.Integer,
                sa.ForeignKey('idea.id', ondelete="CASCADE", onupdate="CASCADE"),
                nullable=True))
        op.add_column('lickert_idea_vote',
            sa.Column('temp', sa.Integer))
        op.execute('UPDATE lickert_idea_vote SET temp = vote_value')
        op.drop_column('lickert_idea_vote', 'vote_value')
        op.add_column('lickert_idea_vote',
            sa.Column('vote_value', sa.Float))
        op.execute('UPDATE lickert_idea_vote SET vote_value = temp')
        op.drop_column('lickert_idea_vote', 'temp')


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('idea_vote', 'criterion_id')
        op.add_column('lickert_idea_vote',
            sa.Column('temp', sa.Float))
        op.execute('UPDATE lickert_idea_vote SET temp = vote_value')
        op.drop_column('lickert_idea_vote', 'vote_value')
        op.add_column('lickert_idea_vote',
            sa.Column('vote_value', sa.Integer))
        op.execute('UPDATE lickert_idea_vote SET vote_value = floor(temp)')
        op.drop_column('lickert_idea_vote', 'temp')
