"""edgesense

Revision ID: fcf4b698a8a
Revises: 2e96ee310c2f
Create Date: 2015-04-08 16:37:01.418049

"""

# revision identifiers, used by Alembic.
revision = 'fcf4b698a8a'
down_revision = '2e96ee310c2f'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'edgesense_drupal_source',
            sa.Column('id', sa.Integer, sa.ForeignKey(
                      'post_source.id',
                      onupdate='CASCADE',
                      ondelete='CASCADE'), primary_key=True),
            sa.Column('node_source', sa.String(1024), nullable=False),
            sa.Column('node_root', sa.String(200)),
            sa.Column('user_source', sa.String(1024), nullable=False),
            sa.Column('comment_source', sa.String(1024), nullable=False),
            sa.Column('post_id_prepend', sa.String(100), nullable=False)
            )

        op.create_table(
            'source_specific_account',
            sa.Column('id', sa.Integer, sa.ForeignKey(
                      'abstract_agent_account.id',
                      onupdate='CASCADE',
                      ondelete='CASCADE'), primary_key=True),
            sa.Column('user_info', sa.Text),
            sa.Column('user_link', sa.String(1024)),
            sa.Column('user_id', sa.String(15), nullable=False),
            sa.Column('source_id', sa.Integer, sa.ForeignKey(
                      'edgesense_drupal_source.id', onupdate='CASCADE',
                      ondelete='CASCADE'), nullable=False),
            )

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('source_specific_account')
        op.drop_table('edgesense_drupal_source')
