"""Document.av_checked

Revision ID: c14c885ecdc2
Revises: c67bcb5d6faa
Create Date: 2017-12-01 16:06:57.043951

"""

# revision identifiers, used by Alembic.
revision = 'c14c885ecdc2'
down_revision = 'c67bcb5d6faa'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        avs = sa.Enum(
            "unchecked", "passed" "failed", name="anti_virus_status")
        # No create_type in alembic?
        op.execute("CREATE TYPE anti_virus_status AS ENUM ('failed', 'passed', 'unchecked')")
        op.add_column(
            'file', sa.Column('av_checked', avs, server_default='unchecked'))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column(
            'file', 'av_checked')
        op.execute('DROP TYPE anti_virus_status')
