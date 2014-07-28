"""votes by widget

Revision ID: 31c0cfa82b14
Revises: ef4c35401ab
Create Date: 2014-07-25 15:52:54.466742

"""

# revision identifiers, used by Alembic.
revision = '31c0cfa82b14'
down_revision = 'ef4c35401ab'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.execute('delete from idea_vote')
        op.add_column(
            'idea_vote', sa.Column(
                'widget_id', sa.Integer, sa.ForeignKey(
                    'widget.id', ondelete="CASCADE", onupdate="CASCADE"),
                nullable=False))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('idea_vote', 'widget_id')
