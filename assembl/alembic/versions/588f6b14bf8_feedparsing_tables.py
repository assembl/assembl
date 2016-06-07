"""feedparsing tables

Revision ID: 588f6b14bf8
Revises: 418b92acbcc5
Create Date: 2015-02-20 14:04:26.060435

"""

# revision identifiers, used by Alembic.
revision = '588f6b14bf8'
down_revision = '435a9acff264'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'feed_posts_source',
            sa.Column(
                'id', sa.Integer, sa.ForeignKey(
                    'post_source.id', ondelete='CASCADE', onupdate='CASCADE'),
                primary_key=True),
            sa.Column(
                'url', sa.String(1024), nullable=False),
            sa.Column(
                'parser_full_class_name', sa.String(512), nullable=False))
        op.create_table(
            'weblink_user',
            sa.Column('id', sa.Integer, sa.ForeignKey(
                    'abstract_agent_account.id',
                    ondelete='CASCADE',
                    onupdate='CASCADE'), primary_key=True),
            sa.Column('user_link', sa.String(1024), unique=True))

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        # Drop in the reverse order than was created.
        op.drop_table('weblink_user')
        op.drop_table('feed_posts_source')
