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
            sa.Column('tombstone_date', sa.DateTime, server_default=None),
            sa.schema.UniqueConstraint("title_id", "text_id", "tombstone_date")
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
