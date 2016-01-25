"""userlanguagepref uniqueness

Revision ID: 358edeb4135c
Revises: 4ee1c4902cea
Create Date: 2016-01-18 17:26:00.862217

"""

# revision identifiers, used by Alembic.
revision = '358edeb4135c'
down_revision = '4ee1c4902cea'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_constraint(
            "%s_%s_user_language_preference_UNQC_user_id_locale_id" % (
                config.get('db_schema'), config.get('db_user')),
            "user_language_preference")
        op.create_unique_constraint(
            "%s_%s_user_language_preference_UNQC_user_id_locale_id_source_of_evidence" % (
                config.get('db_schema'), config.get('db_user')),
            "user_language_preference", ["user_id", "locale_id", "source_of_evidence"])


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.execute("delete from user_language_preference where source_of_evidence > 0")
    with context.begin_transaction():
        op.drop_constraint(
            "%s_%s_user_language_preference_UNQC_user_id_locale_id_source_of_evidence" % (
                config.get('db_schema'), config.get('db_user')),
            "user_language_preference")
        op.create_unique_constraint(
            "%s_%s_user_language_preference_UNQC_user_id_locale_id" % (
                config.get('db_schema'), config.get('db_user')),
            "user_language_preference", ["user_id", "locale_id"])
