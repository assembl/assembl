"""preferences

Revision ID: 4710aefc13ce
Revises: 3bfbb0ef1bd6
Create Date: 2015-07-07 11:35:27.963999

"""

# revision identifiers, used by Alembic.
revision = '4710aefc13ce'
down_revision = '3bfbb0ef1bd6'

from alembic import context, op
import sqlalchemy as sa


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'preferences',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('name', sa.Unicode, nullable=False),
            sa.Column('cascade_id', sa.Integer,
                      sa.ForeignKey('preferences.id'), nullable=True),
            sa.Column('values', sa.Text()))
        op.add_column(
            'discussion',
            sa.Column('preferences_id', sa.Integer,
                      sa.ForeignKey("preferences.id")))
        # The contents are not worth saving yet.
        op.drop_column('discussion', 'settings')


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('discussion', 'preferences_id')
        op.drop_table('preferences')
        op.add_column('discussion', sa.Column('settings', sa.Text))
