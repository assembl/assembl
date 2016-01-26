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
        op.execute("delete from locale_label")
        op.create_unique_constraint(
            "%s_%s_locale_label_UNQC_named_locale_id_locale_id_of_label" % (
                config.get('db_schema'), config.get('db_user')),
            "locale_label", ["named_locale_id", "locale_id_of_label"])
    with transaction.manager:
        from assembl import models as m
        m.LocaleLabel.load_names()


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_constraint(
            "%s_%s_locale_label_UNQC_named_locale_id_locale_id_of_label" % (
                config.get('db_schema'), config.get('db_user')),
            "locale_label")
