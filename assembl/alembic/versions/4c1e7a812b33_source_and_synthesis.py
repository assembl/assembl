"""source and synthesis models

Revision ID: 4c1e7a812b33
Revises: 1f236361ce82
Create Date: 2013-08-04 13:32:40.850141

"""

# revision identifiers, used by Alembic.
revision = '4c1e7a812b33'
down_revision = None

from alembic import context, op
import sqlalchemy as sa
import transaction
from datetime import datetime


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table('agent_profile',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('name', sa.Unicode(1024)),
            sa.Column('type', sa.String(60)))
        op.create_table('restricted_access_model',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('type', sa.String(60), nullable=False),
            sa.Column('owner_id', sa.Integer, sa.ForeignKey(
                'agent_profile.id', ondelete='CASCADE')))
        op.create_table('discussion',
            sa.Column(
                'id', sa.Integer,
                sa.ForeignKey('restricted_access_model.id', ondelete='CASCADE'),
                primary_key=True),
            sa.Column('topic', sa.Unicode(255), nullable=False),
            sa.Column(
                'creation_date', sa.DateTime, nullable=False,
                default=datetime.utcnow))
        op.create_table('source',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('name', sa.Unicode(60), nullable=False),
            sa.Column('type', sa.String(60), nullable=False),
            sa.Column(
                'creation_date', sa.DateTime, nullable=False,
                default=datetime.utcnow),
            sa.Column('last_import', sa.DateTime),
            sa.Column(
                'discussion_id', sa.Integer,
                sa.ForeignKey('discussion.id', ondelete='CASCADE')))
        op.create_table('content',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('type', sa.String(60), nullable=False),
            sa.Column(
                'creation_date', sa.DateTime, nullable=False,
                default=datetime.utcnow),
            sa.Column('import_date', sa.DateTime, default=datetime.utcnow),
            sa.Column(
                'source_id', sa.Integer,
                sa.ForeignKey('source.id', ondelete='CASCADE')))
        op.create_table('mailbox',
            sa.Column(
                'id', sa.Integer,
                sa.ForeignKey('source.id', ondelete='CASCADE'),
                primary_key=True),
            sa.Column('host', sa.Unicode(1024), nullable=False),
            sa.Column('port', sa.Integer, nullable=False),
            sa.Column('username', sa.Unicode(1024), nullable=False),
            sa.Column('use_ssl', sa.Boolean, default=True),
            sa.Column('password', sa.Unicode(1024), nullable=False),
            sa.Column(
                'mailbox', sa.Unicode(1024), default=u"INBOX",
                nullable=False),
            sa.Column('last_imported_email_uid', sa.Unicode(255)))
        op.create_table('post',
            sa.Column(
                'id', sa.Integer,
                sa.ForeignKey('content.id', ondelete='CASCADE'),
                primary_key=True),
            sa.Column('ancestry', sa.Text, default=""),
            sa.Column('parent_id', sa.Integer, sa.ForeignKey('post.id')))
        op.create_table('email',
            sa.Column(
                'id', sa.Integer,
                sa.ForeignKey('post.id', ondelete='CASCADE'),
                primary_key=True),
            sa.Column('to_address', sa.Unicode(1024), nullable=False),
            sa.Column('from_address', sa.Unicode(1024), nullable=False),
            sa.Column('subject', sa.Unicode(1024), nullable=False),
            sa.Column('body', sa.UnicodeText),
            sa.Column('full_message', sa.UnicodeText),
            sa.Column('message_id', sa.Unicode(255)),
            sa.Column('in_reply_to', sa.Unicode(255)))
        op.create_table('table_of_contents',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column(
                'creation_date', sa.DateTime, nullable=False,
                default=datetime.utcnow),
            sa.Column(
                'discussion_id', sa.Integer,
                sa.ForeignKey('discussion.id'), nullable=False))
        op.create_table('idea',
            sa.Column('long_title', sa.Unicode(255)),
            sa.Column('short_title', sa.Unicode(255)),
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column(
                'creation_date', sa.DateTime, nullable=False,
                default=datetime.utcnow),
            sa.Column('order', sa.Float, nullable=False, default=0.0),
            sa.Column(
                'table_of_contents_id', sa.Integer,
                sa.ForeignKey('table_of_contents.id'),
                nullable=False))
        op.create_table('idea_association',
            sa.Column('parent_id', sa.Integer, sa.ForeignKey('idea.id')),
            sa.Column('child_id', sa.Integer, sa.ForeignKey('idea.id')))
        op.create_table('extract',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column(
                'creation_date', sa.DateTime,
                nullable=False, default=datetime.utcnow),
            sa.Column('order', sa.Float, nullable=False, default=0.0))
        # Leaving auth.models for another change.

    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('extract')
        op.drop_table('idea_association')
        op.drop_table('idea')
        op.drop_table('table_of_contents')
        op.drop_table('email')
        op.drop_table('post')
        op.drop_table('mailbox')
        op.drop_table('content')
        op.drop_table('source')
        op.drop_table('discussion')
        op.drop_table('restricted_access_model')
        op.drop_table('agent_profile')
