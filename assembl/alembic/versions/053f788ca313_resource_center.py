"""resource_center

Revision ID: 053f788ca313
Revises: 025d088eb45a
Create Date: 2017-10-16 18:16:11.329055

"""

# revision identifiers, used by Alembic.
revision = '053f788ca313'
down_revision = '025d088eb45a'

from alembic import context, op
import sqlalchemy as sa
import transaction

from assembl.lib import config


def upgrade(pyramid_env):
    from assembl.auth import P_MANAGE_RESOURCE, R_MODERATOR, R_ADMINISTRATOR
    from assembl import models as m

    db = m.get_session_maker()()
    with transaction.manager:
        # Give the P_MANAGE_RESOURCE permission to R_ADMINISTRATOR and R_MODERATOR
        p_manage_resource = db.query(m.Permission).filter_by(name=P_MANAGE_RESOURCE).one()
        r_administrator = db.query(m.Role).filter_by(name=R_ADMINISTRATOR).one()
        r_moderator = db.query(m.Role).filter_by(name=R_MODERATOR).one()
        discussions = db.query(m.Discussion.id).all()
        for discussion_id in discussions:
            db.add(m.DiscussionPermission(
                discussion_id = discussion_id,
                role_id = r_administrator.id,
                permission_id = p_manage_resource.id))
            db.add(m.DiscussionPermission(
                discussion_id = discussion_id,
                role_id = r_moderator.id,
                permission_id = p_manage_resource.id))

    with context.begin_transaction():
        op.add_column(
            'discussion', sa.Column('resources_center_title_id',
            sa.Integer(), sa.ForeignKey('langstring.id')))

        op.create_table(
            'resource',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('type', sa.String(60), nullable=False),
            sa.Column('discussion_id',
                sa.Integer,
                sa.ForeignKey(
                  'discussion.id',
                   ondelete="CASCADE",
                   onupdate="CASCADE"), nullable=False, index=False),
            sa.Column("title_id", sa.Integer, sa.ForeignKey("langstring.id")),
            sa.Column("text_id", sa.Integer, sa.ForeignKey("langstring.id")),
            sa.Column('embed_code', sa.Text()),
            sa.schema.UniqueConstraint("title_id", "text_id")
        )
        op.create_table(
            'resource_attachment',
            sa.Column(
                'id',
                sa.Integer,
                sa.ForeignKey(
                    'attachment.id',
                    ondelete="CASCADE",
                    onupdate="CASCADE"
                ),
                primary_key=True
            ),
            sa.Column(
                'resource_id',
                sa.Integer,
                sa.ForeignKey(
                    'post.id',
                    ondelete="CASCADE",
                    onupdate="CASCADE"
                ),
                nullable=False,
                index=True
            ),
        )

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('resource')
        op.drop_table('resource_attachment')
        op.drop_column('discussion', 'resources_center_title_id')
