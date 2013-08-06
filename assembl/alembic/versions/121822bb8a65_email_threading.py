"""Email threading

Revision ID: 121822bb8a65
Revises: 3d5affc78c95
Create Date: 2012-06-27 19:53:29.356879

"""

# revision identifiers, used by Alembic.
revision = '121822bb8a65'
down_revision = '3d5affc78c95'

from uuid import uuid4

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl import models as m
from assembl.models.post import msg_id
from assembl.lib import config

db = m.DBSession


def upgrade(pyramid_env):
    with context.begin_transaction():
        if not config.get('sqlalchemy.url').startswith('sqlite'):
            op.drop_column('posts', u'headers')
        op.add_column('posts', sa.Column('message_id', sa.String(),
                      nullable=True))
        op.add_column('posts', sa.Column('parent_id', sa.Integer(),
                      nullable=True))
        op.create_table('emails',
            sa.Column('ins_date', sa.DateTime(), nullable=False),
            sa.Column('mod_date', sa.DateTime(), nullable=False),
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('headers', sa.Text(), nullable=False),
            sa.Column('body', sa.Text(), nullable=False),
            sa.Column('post_id', sa.Integer(), nullable=True),
            sa.ForeignKeyConstraint(['post_id'], ['posts.id'], ),
            sa.PrimaryKeyConstraint('id'))

    with transaction.manager:
        for post in db.query(m.Post).all():
            if not post.message_id:
                post.message_id = msg_id()

    with context.begin_transaction():
        op.alter_column('posts', u'message_id', 
                   existing_type=sa.VARCHAR(), 
                   nullable=False)


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('posts', sa.Column(u'headers', sa.Text(), nullable=True))
        if not config.get('sqlalchemy.url').startswith('sqlite'):
            op.drop_column('posts', 'message_id')
            op.drop_column('posts', 'parent_id')
        op.drop_table('emails')
