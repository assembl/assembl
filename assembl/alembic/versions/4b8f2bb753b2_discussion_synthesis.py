"""discussion.synthesis_id cascade on delete

Revision ID: 4b8f2bb753b2
Revises: 40b909900ff7
Create Date: 2013-08-21 13:19:16.801145

"""

# revision identifiers, used by Alembic.
revision = '4b8f2bb753b2'
down_revision = '40b909900ff7'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl import models as m
from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_foreign_key(
            'discussion_synthesis_id_fkey',
            'discussion',
            'synthesis',
            ['synthesis_id'],
            ['id'],
            ondelete="CASCADE"
        )

    # Do stuff with the app's models here.
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_constraint('discussion_synthesis_id_fkey', 'discussion')
