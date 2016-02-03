"""langstringentry.error_code

Revision ID: 53b64260ffb8
Revises: 535a27ae52d8
Create Date: 2016-02-03 09:44:07.159544

"""

# revision identifiers, used by Alembic.
revision = '53b64260ffb8'
down_revision = '535a27ae52d8'

from alembic import context, op
import sqlalchemy as sa
import transaction


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            "langstring_entry",
            sa.Column("error_code", sa.SmallInteger))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column("langstring_entry", "error_code")
