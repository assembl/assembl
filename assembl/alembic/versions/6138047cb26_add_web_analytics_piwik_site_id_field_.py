"""add web_analytics_piwik_site_id field in discussion table

Revision ID: 6138047cb26
Revises: 418b92acbcc5
Create Date: 2015-02-24 16:50:16.854035

"""

# revision identifiers, used by Alembic.
revision = '6138047cb26'
down_revision = '418b92acbcc5'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            'discussion',
            sa.Column('web_analytics_piwik_id_site', sa.Integer, nullable=True))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('discussion', 'web_analytics_piwik_id_site')
