"""preferred_locale moves to preferences

Revision ID: 1e3856969b22
Revises: 5ab9a842c31f
Create Date: 2016-03-12 20:51:18.839106

"""

# revision identifiers, used by Alembic.
revision = '1e3856969b22'
down_revision = '5ab9a842c31f'

from alembic import context, op
import sqlalchemy as sa
import transaction
import simplejson as json

from assembl.lib import config
from assembl.lib.sqla import mark_changed
from assembl.lib.locale import strip_country


def upgrade(pyramid_env):
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        for (locales, pref_id, pref) in db.execute(
                """SELECT discussion.preferred_locales, preferences.id, preferences."values"
                FROM discussion
                JOIN preferences
                    ON discussion.preferences_id = preferences.id"""):
            if locales is not None:
                pref = {} if pref is None else json.loads(pref)
                pref["preferred_locales"] = [
                    strip_country(l) for l in locales.split()]
                db.execute(sa.text(
                    'UPDATE preferences SET "values"=:val where id=:pref_id'
                    ).bindparams(
                        val=json.dumps(pref), pref_id=pref_id))
                mark_changed()

    with context.begin_transaction():
        op.drop_column("discussion", "preferred_locales")


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            "discussion",
            sa.Column("preferred_locales", sa.String))

    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        for (discussion_id, val) in db.execute(
                """SELECT discussion.id, preferences."values"
                FROM discussion
                JOIN preferences
                    ON discussion.preferences_id = preferences.id"""):
            if val is not None:
                locales = json.loads(val).get("preferred_locales", None)
                if locales is not None:
                    db.execute(
                        sa.text("""UPDATE discussion
                            SET preferred_locales = :locales
                            WHERE id = :discussion_id"""
                        ).bindparams(
                            locales=" ".join(locales),
                            discussion_id=discussion_id))
                    mark_changed()
