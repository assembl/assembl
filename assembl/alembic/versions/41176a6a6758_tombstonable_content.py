"""tombstonable Content

Revision ID: 41176a6a6758
Revises: 5eb326c815de
Create Date: 2016-07-26 18:00:28.194728

"""

# revision identifiers, used by Alembic.
revision = '41176a6a6758'
down_revision = '5eb326c815de'

from alembic import context, op
import sqlalchemy as sa
import transaction


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('content', sa.Column('tombstone_date', sa.DateTime))


    from assembl import models as m
    from assembl.auth import P_DELETE_MY_POST, P_DELETE_POST, P_ADD_POST, P_MODERATE
    from pyramid.security import Authenticated, Everyone

    db = m.get_session_maker()()
    with transaction.manager:
    	# Give the P_DELETE_MY_POST permission to every role which already has the P_ADD_POST permission
        p_add_post = db.query(m.Permission).filter_by(name=P_ADD_POST).one()
        p_delete_my_post = db.query(m.Permission).filter_by(name=P_DELETE_MY_POST).one()

        dps = db.query(m.DiscussionPermission).filter_by(
        	permission_id=p_add_post.id)
        for dp in dps:
            db.add(m.DiscussionPermission(
                discussion_id = dp.discussion_id,
                role_id = dp.role_id,
                permission_id = p_delete_my_post.id))

        # Give the P_DELETE_POST permission to every role which already has the P_MODERATE permission
        p_moderate = db.query(m.Permission).filter_by(name=P_MODERATE).one()
        p_delete_post = db.query(m.Permission).filter_by(name=P_DELETE_POST).one()

        dps2 = db.query(m.DiscussionPermission).filter_by(
        	permission_id=p_moderate.id)
        for dp in dps2:
            db.add(m.DiscussionPermission(
                discussion_id = dp.discussion_id,
                role_id = dp.role_id,
                permission_id = p_delete_post.id))


def downgrade(pyramid_env):
    # Remove tombstone_date column from content table
    with context.begin_transaction():
        op.drop_column('content', 'tombstone_date')


    # Remove P_DELETE_MY_POST and P_DELETE_POST permissions, as well as their appearances in DiscussionPermission table (their activation on roles)
    from assembl import models as m
    from assembl.auth import P_DELETE_MY_POST, P_DELETE_POST
    db = m.get_session_maker()()
    with transaction.manager:
        p_delete_my_post = db.query(m.Permission).filter_by(name=P_DELETE_MY_POST).one()
        p_delete_post = db.query(m.Permission).filter_by(name=P_DELETE_POST).one()

        db.query(m.DiscussionPermission).filter_by(
            permission_id=p_delete_post.id).delete()
        db.query(m.DiscussionPermission).filter_by(
            permission_id=p_delete_my_post.id).delete()

        p_delete_post.delete()
        p_delete_my_post.delete()
