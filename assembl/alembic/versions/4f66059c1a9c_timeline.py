"""timeline

Revision ID: 4f66059c1a9c
Revises: 3b4e6d894f6
Create Date: 2014-09-12 10:00:16.687929

"""

# revision identifiers, used by Alembic.
revision = '4f66059c1a9c'
down_revision = '3b4e6d894f6'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'timeline_event',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('discussion_id', sa.Integer, sa.ForeignKey(
                      'discussion.id', ondelete='CASCADE',
                      onupdate='CASCADE')),
            sa.Column('type', sa.String(60), nullable=False),
            sa.Column('title', sa.Unicode(), nullable=False),
            sa.Column('description', sa.UnicodeText),
            sa.Column('start', sa.DateTime),
            sa.Column('end', sa.DateTime),
            sa.Column('previous_event_id', sa.Integer,
                sa.ForeignKey('timeline_event.id')),
        )

def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('timeline_event')
