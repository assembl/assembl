"""xpath double slash correction

Revision ID: 9dfb584793b1
Revises: 083c79582c91
Create Date: 2018-04-18 18:29:07.240836

"""

# revision identifiers, used by Alembic.
revision = '9dfb584793b1'
down_revision = '083c79582c91'

from sqlalchemy.sql import text
import transaction


from assembl.lib.sqla import mark_changed


def upgrade(pyramid_env):
    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        r = list(db.execute("""SELECT id, xpath_start, xpath_end
            FROM text_fragment_identifier
            WHERE xpath_start LIKE '%]//%'
              OR xpath_start LIKE '%]//%'"""))
        params = [{
            'id': id,
            'xstart': ']/'.join(xstart.split(']//')),
            'xend': ']/'.join(xend.split(']//')),
        } for (id, xstart, xend) in r]
        query = text("""UPDATE text_fragment_identifier
                SET xpath_start=:xstart, xpath_end=:xend
                WHERE id=:id""")
        for p in params:
            db.execute(query, p)

        mark_changed()


def downgrade(pyramid_env):
    pass
