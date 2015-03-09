"""source_errors

Revision ID: 44f588d96b14
Revises: 435a9acff264
Create Date: 2015-03-02 08:30:00.252194

"""

# revision identifiers, used by Alembic.
revision = '44f588d96b14'
down_revision = '588f6b14bf8'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column("content_source",
            sa.Column("connection_error", sa.SmallInteger))
        op.add_column("content_source",
            sa.Column("error_description", sa.String))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column("content_source", "connection_error")
        op.drop_column("content_source", "error_description")
