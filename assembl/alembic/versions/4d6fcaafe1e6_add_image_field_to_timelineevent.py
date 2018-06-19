"""add image field to TimelineEvent

Revision ID: 4d6fcaafe1e6
Revises: a93692e62aed
Create Date: 2018-06-19 10:59:22.526825

"""

# revision identifiers, used by Alembic.
revision = '4d6fcaafe1e6'
down_revision = 'a93692e62aed'

from alembic import context, op
import sqlalchemy as sa


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'timeline_event_attachment',
            sa.Column(
                'id',
                sa.Integer,
                sa.ForeignKey(
                    'attachment.id',
                    ondelete="CASCADE",
                    onupdate="CASCADE"
                ),
                primary_key=True
            ),
            sa.Column(
                'timeline_event_id',
                sa.Integer,
                sa.ForeignKey(
                    'timeline_event.id',
                    ondelete="CASCADE",
                    onupdate="CASCADE"
                ),
                nullable=False,
                index=True
            ),
        )


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('timeline_event_attachment')
