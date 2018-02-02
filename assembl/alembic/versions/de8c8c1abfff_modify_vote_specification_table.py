"""Modify vote_specification table

Revision ID: de8c8c1abfff
Revises: 27179de32822
Create Date: 2018-01-23 16:04:10.252470

"""

# revision identifiers, used by Alembic.
revision = 'de8c8c1abfff'
down_revision = '27179de32822'

from alembic import context, op
import sqlalchemy as sa
import transaction


def upgrade(pyramid_env):
    with transaction.manager:
        op.add_column('vote_specification',
            sa.Column(
                'title_id',
                sa.Integer(),
                sa.ForeignKey('langstring.id'), nullable=True, index=True))
        op.add_column(
            'vote_specification',
            sa.Column(
                'instructions_id',
                sa.Integer(),
                sa.ForeignKey('langstring.id'), nullable=True, index=True))
        op.add_column(
            'vote_specification',
            sa.Column(
                'vote_session_id',
                sa.Integer(),
                sa.ForeignKey('vote_session.id'), nullable=True, index=True))
        op.alter_column(
            'vote_specification', 'widget_id', nullable=True)


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('vote_specification', 'title_id')
        op.drop_column('vote_specification', 'instructions_id')
        op.drop_column('vote_specification', 'vote_session_id')
        op.alter_column("vote_specification", "widget_id", nullable=False)
