"""file_upload

Revision ID: 1e01b5f0e5f9
Revises: 13cb36c87aea
Create Date: 2016-03-23 16:46:15.309571

"""

# revision identifiers, used by Alembic.
revision = '1e01b5f0e5f9'
down_revision = '13cb36c87aea'

from datetime import datetime
from alembic import context, op
import sqlalchemy as sa
import transaction

from assembl.lib.sqla_types import URLString
from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            "document",
            sa.Column('type', sa.String(60)),
            config.get("db_schema"))
        op.execute("""UPDATE document SET "type"='document'""")
        op.alter_column("document", "type", nullable=False)

    with context.begin_transaction():
        op.create_table(
            'file',
            sa.Column('id', sa.Integer, sa.ForeignKey(
                      'document.id', onupdate='CASCADE',
                      ondelete='CASCADE'), primary_key=True),
            sa.Column('data', sa.LargeBinary, nullable=False)
        )


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('file')
        op.drop_column('document', 'type')
