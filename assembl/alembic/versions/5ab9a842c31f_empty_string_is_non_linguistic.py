"""empty string is non-linguistic

Revision ID: 5ab9a842c31f
Revises: 3cc1683d2f24
Create Date: 2016-03-08 15:23:43.745133

"""

# revision identifiers, used by Alembic.
revision = '5ab9a842c31f'
down_revision = '3cc1683d2f24'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    from assembl import models as m
    db = m.get_session_maker()()
    with context.begin_transaction():
        loc_ids = dict(list(db.execute(
            "select code, id from locale where code in ('zxx','und')")))
        db.execute(
            """UPDATE langstring_entry SET locale_id=%d
            WHERE "value" IS NULL AND locale_id=%d""" % (
                loc_ids['zxx'], loc_ids['und']))


def downgrade(pyramid_env):
    from assembl import models as m
    db = m.get_session_maker()()
    with context.begin_transaction():
        loc_ids = dict(list(db.execute(
            "select code, id from locale where code in ('zxx','und')")))
        db.execute(
            """UPDATE langstring_entry SET locale_id=%d
            WHERE "value" IS NULL AND locale_id=%d""" % (
                loc_ids['und'], loc_ids['zxx']))
