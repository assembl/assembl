"""file_upload

Revision ID: 1e01b5f0e5f9
Revises: 11d73c586596
Create Date: 2016-03-23 16:46:15.309571

"""

# revision identifiers, used by Alembic.
revision = '1e01b5f0e5f9'
down_revision = '11d73c586596'

from alembic import context, op
import sqlalchemy as sa


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'file',
            sa.Column('id', sa.Integer, sa.ForeignKey(
                      'document.id', onupdate='CASCADE',
                      ondelete='CASCADE'), primary_key=True),
            sa.Column('data', sa.LargeBinary, nullable=False)
        )


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('file')
