"""Add gauge tables

Revision ID: bf6d8d4d2aff
Revises: de8c8c1abfff
Create Date: 2018-01-29 12:48:29.533325

"""

# revision identifiers, used by Alembic.
revision = 'bf6d8d4d2aff'
down_revision = 'de8c8c1abfff'

from alembic import context, op
import sqlalchemy as sa


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'gauge_choice_specification',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('value', sa.Float),
            sa.Column('label_id', sa.Integer, sa.ForeignKey('langstring.id')),
            sa.Column(
                'vote_specification_id',
                sa.Integer,
                sa.ForeignKey('vote_specification.id', ondelete='CASCADE', onupdate='CASCADE'),
                nullable=False, index=True)
        )
        op.create_table(
            'number_gauge_vote_specification',
            sa.Column(
                'id', sa.Integer,
                sa.ForeignKey('vote_specification.id', ondelete='CASCADE', onupdate='CASCADE'),
                primary_key=True),
            sa.Column('minimum', sa.Float),
            sa.Column('maximum', sa.Float),
            sa.Column('nb_ticks', sa.Integer),
            sa.Column('unit', sa.String(60))
        )
        op.create_table(
            'gauge_idea_vote',
            sa.Column(
                'id',
                sa.Integer,
                sa.ForeignKey('idea_vote.id', ondelete='CASCADE', onupdate='CASCADE'),
                primary_key=True),
            sa.Column('vote_value', sa.Float, nullable=False)
        )


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('gauge_idea_vote')
        op.drop_table('number_gauge_vote_specification')
        op.drop_table('gauge_choice_specification')
