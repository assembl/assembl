"""Revert body index

Revision ID: 43df3099d52a
Revises: 402d9945c62
Create Date: 2015-05-19 13:47:15.900219

"""

# revision identifiers, used by Alembic.
revision = '43df3099d52a'
down_revision = '402d9945c62'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    from virtuoso.textindex import TextIndex

    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        ti = TextIndex(m.Content.body, )
        ti.drop(db.bind)

def downgrade(pyramid_env):
    from virtuoso.textindex import TextIndex

    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        ti = TextIndex(m.Content.body, clusters=[m.Content.discussion_id])
        ti.create(db.bind)
