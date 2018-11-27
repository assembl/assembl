"""fix_tags_constraint

Revision ID: de9ade82771c
Revises: 6fbd5e6465d6
Create Date: 2018-11-27 16:09:37.806501

"""

# revision identifiers, used by Alembic.
revision = 'de9ade82771c'
down_revision = '6fbd5e6465d6'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_constraint(u'keyword_value_key', 'keyword', type_='unique')
        op.create_unique_constraint('unq_value_discussion', 'keyword', ['value', 'discussion_id'])


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
