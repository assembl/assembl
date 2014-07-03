"""proposal post

Revision ID: 10d81337e9f1
Revises: 58ad1d489e56
Create Date: 2014-06-06 07:10:38.835877

"""

# revision identifiers, used by Alembic.
revision = '10d81337e9f1'
down_revision = '58ad1d489e56'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table('idea_proposal_post',
        sa.Column('id', sa.Integer, sa.ForeignKey(
            'assembl_post.id',
            ondelete='CASCADE',
            onupdate='CASCADE'
        ), primary_key=True),
        sa.Column('idea_id', sa.Integer, sa.ForeignKey(
            'idea.id', ondelete="CASCADE", onupdate="CASCADE"),
            nullable=False)
    )

def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('idea_proposal_post')
