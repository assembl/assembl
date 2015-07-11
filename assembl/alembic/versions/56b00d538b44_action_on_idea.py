"""action on idea

Revision ID: 56b00d538b44
Revises: 4710aefc13ce
Create Date: 2015-07-11 00:50:10.905733

"""

# revision identifiers, used by Alembic.
revision = '56b00d538b44'
down_revision = '4710aefc13ce'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'action_on_idea',
            sa.Column(
                'id', sa.Integer,
                sa.ForeignKey(
                    'action.id', ondelete="CASCADE", onupdate='CASCADE'),
                primary_key=True),
            sa.Column(
                'idea_id', sa.Integer,
                sa.ForeignKey(
                    'idea.id', ondelete="CASCADE", onupdate='CASCADE'),
                nullable=False))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('action_on_idea')
