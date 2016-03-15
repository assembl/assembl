"""langstrings

Revision ID: e4edf454f09
Revises: 1c09e0b1ff2a
Create Date: 2015-12-18 18:41:43.800065

"""

# revision identifiers, used by Alembic.
revision = 'e4edf454f09'
down_revision = '1c09e0b1ff2a'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


rtl_locales = set((
    "ar", "dv", "ha", "he", "ks_Arab", "ku_Arab", "ms_Arab",
    "pa_Arab", "fa", "ps", "sd_Arab", "tg_Arab", "ug_Arab",
    "ur", "uz_Arab", "yi"))


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            "locale",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("code", sa.String(20), unique=True),
            sa.Column("rtl", sa.Boolean, server_default="0"))
        op.create_table(
            "locale_label",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column(
                "named_locale_id", sa.Integer, sa.ForeignKey(
                    "locale.id", ondelete="CASCADE", onupdate="CASCADE"),
                nullable=False),
            sa.Column(
                "locale_id_of_label", sa.Integer, sa.ForeignKey(
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

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    import simplejson as json
    names = json.load(open('assembl/nlp/data/language-names.json'))
    with transaction.manager:
        locales = {x[0] for x in names}.union({x[1] for x in names})
        for l in locales:
            parts = l.split("_")
            rtl = parts[0] in rtl_locales or "_".join(parts[:2]) in rtl_locales
            db.add(m.Locale(code=l, rtl=rtl))
    with transaction.manager:
        c = m.Locale.locale_collection
        for (l, t, n) in names:
            db.add(m.LocaleLabel(named_locale_id=c[l], locale_id_of_label=c[t], name=n))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table("langstring_entry")
        op.drop_table("langstring")
        op.drop_table("locale_label")
        op.drop_table("locale")
