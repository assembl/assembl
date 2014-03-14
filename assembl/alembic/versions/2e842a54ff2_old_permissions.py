"""old permissions

Revision ID: 2e842a54ff2
Revises: 3167e90d6636
Create Date: 2014-03-13 21:43:26.954778

"""

# revision identifiers, used by Alembic.
revision = '2e842a54ff2'
down_revision = '3167e90d6636'

from alembic import context, op
import sqlalchemy as sa
from sqlalchemy.orm import subqueryload

import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        pass

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        for dp in db.query(m.DiscussionPermission).join(
                m.Permission).filter_by(name='delete_extract'):
            db.delete(dp)
        db.query(m.Permission).filter_by(
            name='delete_extract').delete()
        for dp in db.query(m.DiscussionPermission).join(
                m.Permission).filter_by(name='delete_post'):
            db.delete(dp)
        db.query(m.Permission).filter_by(
            name='delete_post').delete()
        


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
