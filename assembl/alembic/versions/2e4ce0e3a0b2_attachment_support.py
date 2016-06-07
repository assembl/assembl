"""Attachment support

Revision ID: 2e4ce0e3a0b2
Revises: 1e1d2b26db86
Create Date: 2015-09-28 23:14:13.901450

"""

# revision identifiers, used by Alembic.
revision = '2e4ce0e3a0b2'
down_revision = '1e1d2b26db86'

from alembic import context, op
import sqlalchemy as sa
import transaction
from datetime import datetime

from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'document',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('uri_id', sa.Unicode(1024), server_default="",
                      unique=False, index=True),
            sa.Column('creation_date',
                      sa.DateTime,
                      nullable=False,
                      default=datetime.utcnow),
            sa.Column('discussion_id',
                sa.Integer,
                sa.ForeignKey(
                  'discussion.id',
                   ondelete="CASCADE",
                   onupdate="CASCADE"), nullable=False, index=False,),
            sa.Column('oembed_type', sa.Unicode(1024), server_default=""),
            sa.Column('mime_type', sa.Unicode(1024), server_default=""),
            sa.Column('title', sa.Unicode(1024), server_default=""),
            sa.Column('description', sa.UnicodeText),
            sa.Column('author_name', sa.UnicodeText),
            sa.Column('author_url', sa.UnicodeText),
            sa.Column('thumbnail_url', sa.UnicodeText),
            sa.Column('site_name', sa.UnicodeText),

            )
        op.create_table(
            'attachment',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('creation_date',
                      sa.DateTime,
                      nullable=False,
                      default = datetime.utcnow),
            sa.Column('discussion_id',
                       sa.Integer,
                       sa.ForeignKey(
                            'discussion.id',
                             ondelete="CASCADE",
                             onupdate="CASCADE"),
                nullable=False,
                index=False,),
            sa.Column('document_id',
                       sa.Integer,
                       sa.ForeignKey(
                            'document.id',
                             ondelete="CASCADE",
                             onupdate="CASCADE"),
                nullable=False,),
            sa.Column('creator_id',
                       sa.Integer,
                       sa.ForeignKey(
                            'agent_profile.id',
                             ondelete="CASCADE",
                             onupdate="CASCADE"),
                nullable=False,
                index=False,),
            sa.Column('title', sa.Unicode(1024), server_default=""),
            sa.Column('description', sa.UnicodeText),
            sa.Column('attachmentPurpose', 
                      sa.Unicode(256), 
                      server_default="",
                      index=True,),
            )
        op.create_table(
            'post_attachment',
            sa.Column('id', 
                      sa.Integer,
                      sa.ForeignKey(
                            'attachment.id',
                             ondelete="CASCADE",
                             onupdate="CASCADE"),
                      primary_key=True),
            sa.Column('post_id',
                       sa.Integer,
                       sa.ForeignKey(
                            'post.id',
                             ondelete="CASCADE",
                             onupdate="CASCADE"),
                nullable=False,
                index=True,),
            )
        op.create_table(
            'idea_attachment',
            sa.Column('id', 
                      sa.Integer,
                      sa.ForeignKey(
                            'attachment.id',
                             ondelete="CASCADE",
                             onupdate="CASCADE"),
                      primary_key=True),
            sa.Column('idea_id',
                       sa.Integer,
                       sa.ForeignKey(
                            'idea.id',
                             ondelete="CASCADE",
                             onupdate="CASCADE"),
                nullable=False,
                index=True,),
            )


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('post_attachment')
        op.drop_table('idea_attachment')
        op.drop_table('attachment')
        op.drop_table('document')

