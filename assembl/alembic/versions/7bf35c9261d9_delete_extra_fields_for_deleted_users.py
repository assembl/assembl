"""delete_extra_fields_for_deleted_users

Revision ID: 7bf35c9261d9
Revises: e3f681bd70e0
Create Date: 2018-06-13 14:14:41.037265

"""

# revision identifiers, used by Alembic.
revision = '7bf35c9261d9'
down_revision = 'e757aefa55e1'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        # SQL Alchemy can't delete after a join operation, so we are getting the ids first
        # and deleting the corresponding profile fields
        ids_query = db.query(m.ProfileField.id).join(m.User).filter(m.User.is_deleted == True).all()
        for (id,) in ids_query:
            profile = m.ProfileField.get(id)
            db.delete(profile)


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
