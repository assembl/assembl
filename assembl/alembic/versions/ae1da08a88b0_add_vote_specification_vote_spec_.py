"""Add vote_specification.vote_spec_template_id

Revision ID: ae1da08a88b0
Revises: cc4266c17ceb
Create Date: 2018-02-07 14:33:03.063365

"""

# revision identifiers, used by Alembic.
revision = 'ae1da08a88b0'
down_revision = 'cc4266c17ceb'

from alembic import context, op
import sqlalchemy as sa


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('vote_specification',
            sa.Column(
                'vote_spec_template_id',
                sa.Integer(),
                sa.ForeignKey('vote_specification.id'), nullable=True, index=True))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('vote_specification', 'vote_spec_template_id')
