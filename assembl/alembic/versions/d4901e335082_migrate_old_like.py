"""migrate old like

Revision ID: d4901e335082
Revises: 4253aa01a525
Create Date: 2017-01-19 11:11:49.410048

"""

# revision identifiers, used by Alembic.
revision = 'd4901e335082'
down_revision = '4253aa01a525'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.execute(
            """UPDATE action SET type = 'sentiment:like'
            WHERE type = 'vote:BinaryVote_P' """)


def downgrade(pyramid_env):
    pass
