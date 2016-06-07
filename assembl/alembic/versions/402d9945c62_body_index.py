"""body index

Revision ID: 402d9945c62
Revises: 4af80f6ad90a
Create Date: 2015-05-16 13:51:28.942313

"""

# revision identifiers, used by Alembic.
revision = '402d9945c62'
down_revision = '4af80f6ad90a'

from alembic import context, op
import sqlalchemy as sa
import transaction

from assembl.lib import config


def upgrade(pyramid_env):
    from virtuoso.textindex import TextIndex
    # This looks like a bug in virtuoso, again.
    admin_engine = sa.create_engine('virtuoso://dba:dba@VOSU')
    #admin_session = sa.orm.sessionmaker(admin_engine)
    username = config.get('db_user')
    admin_engine.execute('GRANT SELECT ON DB.DBA.SYS_CLUSTER TO ' + username)

    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        ti = TextIndex(m.Content.body, clusters=[m.Content.discussion_id])
        ti.create(db.bind)


def downgrade(pyramid_env):
    from virtuoso.textindex import TextIndex
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        ti = TextIndex(m.Content.body)
        ti.drop(db.bind)
