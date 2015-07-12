"""preferences.name unique

Revision ID: 2e81cd0680f5
Revises: 56b00d538b44
Create Date: 2015-07-11 00:53:53.937154

"""

# revision identifiers, used by Alembic.
revision = '2e81cd0680f5'
down_revision = '56b00d538b44'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_unique_constraint(
            "_".join((
                config.get('db_schema'),
                config.get('db_user'),
                "preferences_UNQC_name")),
            "preferences", ["name"])


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_constraint(
            "_".join((
                config.get('db_schema'),
                config.get('db_user'),
                "preferences_UNQC_name")),
            "preferences")
