"""Add modification_date and body_mime_type to AssemblPost

Revision ID: 9b1d630ccd06
Revises: c7d63b6ac4e9
Create Date: 2017-08-10 16:29:04.939721

"""

# revision identifiers, used by Alembic.
revision = '9b1d630ccd06'
down_revision = 'c7d63b6ac4e9'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    from assembl.lib.sqla_types import CoerceUnicode
    with context.begin_transaction():
        op.add_column('assembl_post', sa.Column('body_mime_type',
            CoerceUnicode, nullable=False, server_default="text/plain"))
        op.add_column('assembl_post', sa.Column('modification_date',
            sa.DateTime))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('assembl_post', 'body_mime_type')
        op.drop_column('assembl_post', 'modification_date')
