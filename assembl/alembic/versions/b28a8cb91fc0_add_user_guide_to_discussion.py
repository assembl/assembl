"""Add user guide to discussion

Revision ID: b28a8cb91fc0
Revises: 180022eb0f0d
Create Date: 2018-08-27 16:09:29.112075

"""

# revision identifiers, used by Alembic.
revision = 'b28a8cb91fc0'
down_revision = '180022eb0f0d'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'discussion', sa.Column('user_guidelines_id', sa.Integer(), sa.ForeignKey('langstring.id')))

        sa.schema.UniqueConstraint("user_guidelines_id")

def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('discussion', 'user_guidelines_id')
