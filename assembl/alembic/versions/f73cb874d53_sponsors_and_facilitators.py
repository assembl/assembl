"""sponsors and facilitators

Revision ID: f73cb874d53
Revises: 25ef5e68f0aa
Create Date: 2014-09-05 14:29:53.555126

"""

# revision identifiers, used by Alembic.
revision = 'f73cb874d53'
down_revision = '25ef5e68f0aa'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'agent_profile', sa.Column('description', sa.types.UnicodeText()))
        op.create_table(
            'partner_organization',
            sa.Column('id', sa.types.Integer, primary_key=True),
            sa.Column('discussion_id', sa.types.Integer,
                      sa.ForeignKey("discussion.id", ondelete='CASCADE')),
            sa.Column('name', sa.types.Unicode(256)),
            sa.Column('description', sa.types.UnicodeText),
            sa.Column('logo', sa.types.String(256)),
            sa.Column('homepage', sa.types.String(256)),
            sa.Column('is_initiator', sa.types.Boolean))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('agent_profile', 'description')
        op.drop_table('partner_organization')
