"""Add EDIT_MY_POST permission

Revision ID: c7d63b6ac4e9
Revises: 9218849f9579
Create Date: 2017-08-09 15:28:38.870654

"""

# revision identifiers, used by Alembic.
revision = 'c7d63b6ac4e9'
down_revision = '9218849f9579'

from alembic import context, op
import sqlalchemy as sa
import transaction


def upgrade(pyramid_env):
    from assembl import models as m
    from assembl.auth import P_EDIT_MY_POST, P_ADD_POST

    db = m.get_session_maker()()
    with transaction.manager:
        # Give the P_EDIT_MY_POST permission to every role which already has the P_ADD_POST permission
        p_add_post = db.query(m.Permission).filter_by(name=P_ADD_POST).one()
        p_edit_my_post = db.query(m.Permission).filter_by(name=P_EDIT_MY_POST).one()

        dps = db.query(m.DiscussionPermission).filter_by(
            permission_id=p_add_post.id)
        for dp in dps:
            db.add(m.DiscussionPermission(
                discussion_id = dp.discussion_id,
                role_id = dp.role_id,
                permission_id = p_edit_my_post.id))


def downgrade(pyramid_env):
    # Remove P_EDIT_MY_POST permission, as well as its appearance in DiscussionPermission table (its activation on roles)
    from assembl import models as m
    from assembl.auth import P_EDIT_MY_POST
    db = m.get_session_maker()()
    with transaction.manager:
        p_edit_my_post = db.query(m.Permission).filter_by(name=P_EDIT_MY_POST).one()

        db.query(m.DiscussionPermission).filter_by(
            permission_id=p_edit_my_post.id).delete()

        p_edit_my_post.delete()

