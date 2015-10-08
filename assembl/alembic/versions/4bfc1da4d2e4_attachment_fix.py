"""attachment_fix

Revision ID: 4bfc1da4d2e4
Revises: e5d1484442b
Create Date: 2015-10-08 14:08:37.832653

"""

# revision identifiers, used by Alembic.
revision = '4bfc1da4d2e4'
down_revision = 'e5d1484442b'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('attachment', sa.Column('type',
                      sa.String(60), nullable=False))

        # Do stuff with the app's models here.
        from assembl import models as m
        db = m.get_session_maker()()
        with transaction.manager:
            db.execute(
               "UPDATE attachment SET type='post_attachment'"
            )


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('attachment', 'type')
