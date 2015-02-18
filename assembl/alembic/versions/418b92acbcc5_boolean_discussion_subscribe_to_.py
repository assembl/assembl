"""boolean discussion.subscribe_to_notifications_on_signup

Revision ID: 418b92acbcc5
Revises: 104d2f466913
Create Date: 2015-02-16 15:50:26.282031

"""

# revision identifiers, used by Alembic.
revision = '418b92acbcc5'
down_revision = '104d2f466913'

from alembic import context, op
import sqlalchemy as sa
import transaction


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.execute('''ALTER TABLE discussion
            ADD CHECK (subscribe_to_notifications_on_signup IN (0, 1))''')


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
