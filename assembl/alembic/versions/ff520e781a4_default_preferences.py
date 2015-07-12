"""default preferences

Revision ID: ff520e781a4
Revises: 2e81cd0680f5
Create Date: 2015-07-12 08:04:56.418892

"""

# revision identifiers, used by Alembic.
revision = 'ff520e781a4'
down_revision = '2e81cd0680f5'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    # Create default prefs and discussion prefs
    # Hard to get IDs of insert using execute.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        default = m.Preferences(name='default')
        db.add(default)
        for (d_id, slug) in db.execute('SELECT id, slug FROM discussion'):
            p = m.Preferences(name = 'discussion_'+slug, cascade_preferences=default)
            db.add(p)
            db.flush()
            db.execute("""UPDATE discussion SET preferences_id = %d
                WHERE id = %d""" % (p.id, d_id))

def downgrade(pyramid_env):
    pass
