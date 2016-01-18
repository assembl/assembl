"""langstring name uniqueness

Revision ID: 4ee1c4902cea
Revises: 21fdae57b099
Create Date: 2016-01-18 09:54:48.412907

"""

# revision identifiers, used by Alembic.
revision = '4ee1c4902cea'
down_revision = '21fdae57b099'

from alembic import context, op
from assembl.lib import config
from assembl.lib.sqla import mark_changed
import transaction


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.execute("delete from locale_name")
        op.create_unique_constraint(
            "%s_%s_locale_name_UNQC_locale_id_target_locale_id" % (
                config.get('db_schema'), config.get('db_user')),
            "locale_name", ["locale_id", "target_locale_id"])
    with transaction.manager:
        from assembl import models as m
        m.LocaleName.load_names()


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_constraint(
            "%s_%s_locale_name_UNQC_locale_id_target_locale_id" % (
                config.get('db_schema'), config.get('db_user')),
            "locale_name")
