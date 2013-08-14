"""Renaming Mailbox.mailbox to Mailbox.folder

Revision ID: 2206dfd19893
Revises: 24e6f5182d75
Create Date: 2013-08-14 03:05:28.574832

"""

# revision identifiers, used by Alembic.
revision = '2206dfd19893'
down_revision = '24e6f5182d75'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl import models as m
from assembl.lib import config

db = m.DBSession


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('mailbox', sa.Column('folder', sa.Unicode(length=1024)))

        # Move data from the old column to the new one
        op.execute("UPDATE mailbox SET folder=mailbox")

        # Make the new column non-nullable
        op.alter_column("mailbox", "folder", nullable=False)

        # Drop the old column
        op.drop_column('mailbox', u'mailbox')

    # Do stuff with the app's models here.
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        # Add the old column
        op.add_column(
            'mailbox', 
            sa.Column(
                u'mailbox',
                sa.VARCHAR(length=1024)
            )
        )

        # Move data from the new column to the old column
        op.execute("UPDATE mailbox SET mailbox=folder")

        # Make the old column non-nullable
        op.alter_column('mailbox', 'mailbox', nullable=False)

        # Drop the new column
        op.drop_column('mailbox', 'folder')
