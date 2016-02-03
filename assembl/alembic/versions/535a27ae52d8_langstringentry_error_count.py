"""langstringentry.error_count

Revision ID: 535a27ae52d8
Revises: 50639b470b96
Create Date: 2016-01-29 13:57:26.049415

"""

# revision identifiers, used by Alembic.
revision = '535a27ae52d8'
down_revision = '50639b470b96'

from alembic import context, op
import sqlalchemy as sa
import transaction


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            "langstring_entry",
            sa.Column("error_count", sa.Integer))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column("langstring_entry", "error_count")
