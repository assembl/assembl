"""langstrings

Revision ID: e4edf454f09
Revises: 3738207829e0
Create Date: 2015-12-18 18:41:43.800065

"""

# revision identifiers, used by Alembic.
revision = 'e4edf454f09'
down_revision = '3738207829e0'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            "locale",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("locale", sa.String(20), unique=True))
        op.create_table(
            "locale_name",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column(
                "locale_id", sa.Integer, sa.ForeignKey(
                    "locale.id", ondelete="CASCADE", onupdate="CASCADE"),
                nullable=False),
            sa.Column(
                "target_locale_id", sa.Integer, sa.ForeignKey(
                    "locale.id", ondelete="CASCADE", onupdate="CASCADE"),
                nullable=False),
            sa.Column("name", sa.Unicode))
        op.create_table(
            "langstring",
            sa.Column('id', sa.Integer, primary_key=True))
        op.create_table(
            "langstring_entry",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("langstring_id", sa.Integer,
                      sa.ForeignKey(
                        "langstring.id", ondelete="CASCADE"),
                      nullable=False, index=True),
            sa.Column("locale_id", sa.Integer, sa.ForeignKey(
                "locale.id", ondelete="CASCADE", onupdate="CASCADE"),
                nullable=False),
            sa.Column("locale_identification_data", sa.String),
            sa.Column("locale_confirmed", sa.Boolean, server_default="0"),
            sa.Column("tombstone_date", sa.DateTime, server_default=None),
            sa.Column("value", sa.UnicodeText),
            sa.schema.UniqueConstraint(
                "langstring_id", "locale_id", "tombstone_date"))
        op.create_table(
            "post_test",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("title_id", sa.Integer,
                      sa.ForeignKey("langstring.id")),
            sa.Column("body_id", sa.Integer,
                      sa.ForeignKey("langstring.id")))

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table("post_test")
        op.drop_table("langstring_entry")
        op.drop_table("locale_name")
        op.drop_table("locale")
        op.drop_table("langstring")
