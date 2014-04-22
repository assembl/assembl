"""Widget content links

Revision ID: 28f4b541f727
Revises: e546a1bde9
Create Date: 2014-04-22 17:18:34.270649

"""

# revision identifiers, used by Alembic.
revision = '28f4b541f727'
down_revision = 'e546a1bde9'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'idea_content_widget_link',
            sa.Column(
                'id', sa.Integer, sa.ForeignKey(
                    'idea_content_link.id', ondelete='CASCADE',
                    onupdate='CASCADE'), primary_key=True))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('idea_content_widget_link')
