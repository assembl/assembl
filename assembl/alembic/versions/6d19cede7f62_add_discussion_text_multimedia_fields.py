"""Add discussion text_multimedia fields

Revision ID: 6d19cede7f62
Revises: 33735b0850fc
Create Date: 2019-06-07 16:56:06.802948

"""

# revision identifiers, used by Alembic.
revision = '6d19cede7f62'
down_revision = '33735b0850fc'

import sqlalchemy as sa
from alembic import context, op
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'discussion', sa.Column('text_multimedia_title_id', sa.Integer(), sa.ForeignKey('langstring.id')))
        sa.schema.UniqueConstraint("text_multimedia_title_id")
        op.add_column(
            'discussion', sa.Column('text_multimedia_body_id', sa.Integer(), sa.ForeignKey('langstring.id')))
        sa.schema.UniqueConstraint("text_multimedia_body_id")


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('discussion', 'text_multimedia_title_id')
        op.drop_column('discussion', 'text_multimedia_body_id')

