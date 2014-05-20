"""hidden widget ideas

Revision ID: 1fd30009e8b8
Revises: 3ebd3f1deebe
Create Date: 2014-05-15 15:35:29.776889

"""

# revision identifiers, used by Alembic.
revision = '1fd30009e8b8'
down_revision = '3ebd3f1deebe'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'idea', sa.Column(
                'hidden', sa.SmallInteger, server_default='0'))
        op.execute('UPDATE idea set hidden=0')
        op.execute('ALTER TABLE idea ADD CHECK (hidden IN (0, 1))')
        op.add_column(
            'idea', sa.Column(
                'widget_id', sa.Integer, sa.ForeignKey('widget.id')))
        op.add_column(
            'content', sa.Column(
                'hidden', sa.SmallInteger, server_default='0'))
        op.execute('UPDATE content set hidden=0')
        op.execute('ALTER TABLE content ADD CHECK (hidden IN (0, 1))')

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('idea', 'hidden')
        op.drop_column('idea', 'widget_id')
        op.drop_column('content', 'hidden')
