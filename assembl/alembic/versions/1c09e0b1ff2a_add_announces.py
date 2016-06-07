"""Add announces

Revision ID: 1c09e0b1ff2a
Revises: 53875f39d2ff
Create Date: 2015-12-12 05:34:42.131214

"""

# revision identifiers, used by Alembic.
revision = '1c09e0b1ff2a'
down_revision = '3738207829e0'

from alembic import context, op
import sqlalchemy as sa
import transaction
from datetime import datetime

from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'announce',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('type', sa.String(60), nullable=False),
            sa.Column('discussion_id',
                       sa.Integer,
                       sa.ForeignKey(
                            'discussion.id',
                             ondelete="CASCADE",
                             onupdate="CASCADE"),
                nullable=False,
                index=False,),

            sa.Column('creation_date',
                      sa.DateTime,
                      nullable=False,
                      default = datetime.utcnow),

            sa.Column('modification_date',
                      sa.DateTime,
                      nullable=False,
                      default = datetime.utcnow),

            sa.Column('creator_id',
                       sa.Integer,
                       sa.ForeignKey(
                            'agent_profile.id',
                             ondelete="CASCADE",
                             onupdate="CASCADE"),
                nullable=False,
                index=False,),

            sa.Column('last_updated_by_id',
                       sa.Integer,
                       sa.ForeignKey(
                            'agent_profile.id',
                             ondelete="CASCADE",
                             onupdate="CASCADE"),
                nullable=False,
                index=False,),

            sa.Column('title', sa.Unicode(1024), server_default=""),
            sa.Column('body', sa.UnicodeText),
            )
        op.create_table(
            'idea_announce',
            sa.Column('id', 
                      sa.Integer,
                      sa.ForeignKey(
                            'announce.id',
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
            sa.Column('should_propagate_down',
                       sa.Boolean,
                nullable=False,
                index=True,),
            )

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('announce')
        op.drop_table('idea_announce')
