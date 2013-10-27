"""Store truly raw message

Revision ID: 42a76adf343c
Revises: 3b5bb2cefa6d
Create Date: 2013-09-19 16:56:23.345538

"""

# revision identifiers, used by Alembic.
revision = '42a76adf343c'
down_revision = '3b5bb2cefa6d'

from alembic import context, op
import sqlalchemy as sa
import transaction

from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        ### commands auto generated by Alembic - please adjust! ###
        op.drop_column('email', 'full_message')
        op.add_column('email', sa.Column('full_message', sa.Binary(), nullable=True))
        ### end Alembic commands ###

    # Do stuff with the app's models here.
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        ### commands auto generated by Alembic - please adjust! ###
        pass
        ### end Alembic commands ###
