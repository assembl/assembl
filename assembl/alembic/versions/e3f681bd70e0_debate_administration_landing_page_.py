"""debate administration landing page header

Revision ID: e3f681bd70e0
Revises: ce427c9d6013
Create Date: 2018-05-25 16:59:00.488718

"""

# revision identifiers, used by Alembic.
revision = 'e3f681bd70e0'
down_revision = 'ce427c9d6013'

from alembic import context, op
import sqlalchemy as sa
import transaction


def upgrade(pyramid_env):
    with transaction.manager:
        op.add_column(
            'discussion', sa.Column('title_id', sa.Integer(), sa.ForeignKey('langstring.id')))

        sa.schema.UniqueConstraint("title_id")


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('discussion', 'title_id')
