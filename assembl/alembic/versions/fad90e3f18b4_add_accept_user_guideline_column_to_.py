"""Add accept user guideline column to user table

Revision ID: fad90e3f18b4
Revises: b28a8cb91fc0
Create Date: 2018-09-14 11:18:15.970382

"""

# revision identifiers, used by Alembic.
revision = 'fad90e3f18b4'
down_revision = 'b28a8cb91fc0'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('user',
            sa.Column('last_accepted_user_guideline_date', sa.DateTime))
        op.add_column('user',
            sa.Column('last_rejected_user_guideline_date', sa.DateTime))

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('user', 'last_rejected_user_guideline_date')
        op.drop_column('user', 'last_accepted_user_guideline_date')
