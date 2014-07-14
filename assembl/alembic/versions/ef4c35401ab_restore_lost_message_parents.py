"""restore lost message parents

Revision ID: ef4c35401ab
Revises: 328e132a35de
Create Date: 2014-07-14 11:20:17.005163

"""

# revision identifiers, used by Alembic.
revision = 'ef4c35401ab'
down_revision = '328e132a35de'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        orphans = db.query(m.Post).filter(m.Post.ancestry != '', m.Post.parent_id == None).all()
        for p in orphans:
            p.parent_id = int(p.ancestry.split(',')[-2])
