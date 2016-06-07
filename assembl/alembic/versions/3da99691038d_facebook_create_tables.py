"""facebook_create_tables

Revision ID: 3da99691038d
Revises: 2df3bdfbc594
Create Date: 2015-03-31 02:40:42.078547

"""

# revision identifiers, used by Alembic.
revision = '3da99691038d'
down_revision = '2df3bdfbc594'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'facebook_account',
            sa.Column(
                'id', sa.Integer, sa.ForeignKey(
                    'idprovider_agent_account.id',
                    onupdate='CASCADE', ondelete='CASCADE'), primary_key=True),
            sa.Column('app_id', sa.String(512)))

        op.create_table(
            'facebook_source',
            sa.Column('id', sa.Integer, sa.ForeignKey('post_source.id',
                      onupdate='CASCADE',
                      ondelete='CASCADE'), primary_key=True),
            sa.Column('fb_source_id', sa.String(512), nullable=False),
            sa.Column('url_path', sa.String(1024)),
            sa.Column('creator_id', sa.Integer,
                      sa.ForeignKey('facebook_account.id',
                                    onupdate='CASCADE', ondelete='CASCADE')))

        op.create_table(
            'facebook_post',
            sa.Column('id', sa.Integer, sa.ForeignKey('imported_post.id',
                      onupdate='CASCADE',
                      ondelete='CASCADE'), primary_key=True),
            sa.Column('attachment', sa.String(1024)),
            sa.Column('link_name', sa.Unicode(1024)),
            sa.Column('post_type', sa.String(20)))

        op.create_table('facebook_access_token',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('fb_account_id', sa.Integer, sa.ForeignKey(
                      'facebook_account.id',
                      onupdate='CASCADE', ondelete='CASCADE')),
            sa.Column('token', sa.String(512), unique=True),
            sa.Column('expiration', sa.DateTime),
            sa.Column('token_type', sa.String(50)),
            sa.Column('object_name', sa.String(512)),
            sa.Column('object_fb_id', sa.String(512))
        )


    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('facebook_access_token')
        op.drop_table('facebook_post')
        op.drop_table('facebook_source')
        op.drop_table('facebook_account')
