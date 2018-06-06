"""debate administration landing page header

Revision ID: e3f681bd70e0
Revises: 8d704ad414e4
Create Date: 2018-05-25 16:59:00.488718

"""

# revision identifiers, used by Alembic.
revision = 'e3f681bd70e0'
down_revision = '8d704ad414e4'

from alembic import context, op
import sqlalchemy as sa
import transaction


def upgrade(pyramid_env):
    with transaction.manager:
        op.add_column(
            'discussion', sa.Column('title_id', sa.Integer(), sa.ForeignKey('langstring.id')))
        sa.schema.UniqueConstraint("title_id")

        op.add_column(
            'discussion', sa.Column('subtitle_id', sa.Integer(), sa.ForeignKey('langstring.id')))
        sa.schema.UniqueConstraint("subtitle_id")

        op.add_column(
            'discussion', sa.Column('button_label_id', sa.Integer(), sa.ForeignKey('langstring.id')))
        sa.schema.UniqueConstraint("button_label_id")


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('discussion', 'title_id')
        op.drop_column('discussion', 'subtitle_id')
        op.drop_column('discussion', 'button_label_id')
