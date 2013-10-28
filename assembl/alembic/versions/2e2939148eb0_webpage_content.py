"""webpage content

Revision ID: 2e2939148eb0
Revises: 57951973d5ce
Create Date: 2013-10-28 15:30:10.356580

"""

# revision identifiers, used by Alembic.
revision = '2e2939148eb0'
down_revision = '57951973d5ce'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table('webpage',
            sa.Column('id', sa.Integer, sa.ForeignKey(
                'content.id', ondelete='CASCADE'), primary_key=True),
            sa.Column('url', sa.Unicode, unique=True),
            sa.Column('last_modified_date', sa.DateTime, nullable=True))

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('webpage')
