"""add votes

Revision ID: 10159cb599ff
Revises: fc1c46a8634
Create Date: 2014-05-31 09:48:24.270674

"""

# revision identifiers, used by Alembic.
revision = '10159cb599ff'
down_revision = 'fc1c46a8634'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'idea_vote',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('type', sa.String(60), nullable=False),
            sa.Column('idea_id', sa.Integer,
                      sa.ForeignKey('idea.id', ondelete="CASCADE",
                                    onupdate="CASCADE"),
                      nullable=False),
            sa.Column('voter_id', sa.Integer,
                      sa.ForeignKey('user.id', ondelete="CASCADE",
                                    onupdate="CASCADE"),
                      nullable=False))
        op.create_table(
            'lickert_range',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('minimum', sa.Integer),
            sa.Column('maximum', sa.Integer))
        op.create_table(
            'lickert_idea_vote',
            sa.Column('id', sa.Integer, sa.ForeignKey(
                'idea_vote.id',
                ondelete='CASCADE',
                onupdate='CASCADE'
            ), primary_key=True),
            sa.Column(
                'range_id', sa.Integer, sa.ForeignKey(
                    'lickert_range.id', ondelete="CASCADE",
                    onupdate="CASCADE"),
                nullable=False),
            sa.Column('vote_value', sa.Integer, nullable=False))
        op.create_table(
            'binary_idea_vote',
            sa.Column('id', sa.Integer, sa.ForeignKey(
                'idea_vote.id',
                ondelete='CASCADE',
                onupdate='CASCADE'
            ), primary_key=True),
            sa.Column('vote_value', sa.Boolean, nullable=False))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('binary_idea_vote')
        op.drop_table('lickert_idea_vote')
        op.drop_table('lickert_range')
        op.drop_table('idea_vote')
