"""non-null LangStringEntry.value

Revision ID: 4f43341f787e
Revises: 27bb3c90a95d
Create Date: 2016-02-12 17:16:48.412974

"""

# revision identifiers, used by Alembic.
revision = '4f43341f787e'
down_revision = '27bb3c90a95d'

from alembic import context, op
import sqlalchemy as sa


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.execute("update langstring_entry set value='' where value is null")


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
