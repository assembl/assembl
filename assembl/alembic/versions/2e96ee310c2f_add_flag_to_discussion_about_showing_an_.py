"""add flag to discussion about showing an introduction in debate section

Revision ID: 2e96ee310c2f
Revises: 301275210522
Create Date: 2015-04-13 17:50:18.008808

"""

# revision identifiers, used by Alembic.
revision = '2e96ee310c2f'
down_revision = '301275210522'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
    	op.add_column(
            'discussion',
            sa.Column('show_help_in_debate_section', sa.SmallInteger, server_default='1'))
        op.execute('UPDATE discussion set show_help_in_debate_section = 1')
        op.execute('ALTER TABLE discussion ADD CHECK (show_help_in_debate_section IN (0, 1))')


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('discussion', 'show_help_in_debate_section')
