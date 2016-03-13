"""longer locales

Revision ID: 4dcf98a132de
Revises: 1e3856969b22
Create Date: 2016-03-13 17:11:13.005091

"""

# revision identifiers, used by Alembic.
revision = '4dcf98a132de'
down_revision = '1e3856969b22'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_index("%s_%s_locale_UNQC_code" % (
            config.get('db_schema'), config.get('db_user')))
        op.add_column(
            "locale",
            sa.Column("temp_code", sa.String))
        op.execute("UPDATE locale set temp_code = code")
    with context.begin_transaction():
        op.drop_column("locale", "code")
        op.add_column(
            "locale",
            sa.Column("code", sa.String(32)))
        op.execute("UPDATE locale set code = temp_code")
    with context.begin_transaction():
        op.drop_column("locale", "temp_code")
        op.create_index(
            '%s_%s_locale_UNQC_code' % (
                config.get('db_schema'), config.get('db_user')),
            'locale', ['code'], unique=True)


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_index("%s_%s_locale_UNQC_code" % (
            config.get('db_schema'), config.get('db_user')))
        op.add_column(
            "locale",
            sa.Column("temp_code", sa.String))
        op.execute("UPDATE locale set temp_code = code")
    with context.begin_transaction():
        op.drop_column("locale", "code")
        op.add_column(
            "locale",
            sa.Column("code", sa.String(20)))
        op.execute("UPDATE locale set code = temp_code")
    with context.begin_transaction():
        op.drop_column("locale", "temp_code")
        op.create_index(
            '%s_%s_locale_UNQC_code' % (
                config.get('db_schema'), config.get('db_user')),
            'locale', ['code'], unique=True)
