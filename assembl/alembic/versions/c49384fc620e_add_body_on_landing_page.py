"""Add body on landing_page

Revision ID: c49384fc620e
Revises: 33735b0850fc
Create Date: 2019-06-14 09:41:41.807030

"""

# revision identifiers, used by Alembic.
revision = 'c49384fc620e'
down_revision = '33735b0850fc'

import sqlalchemy as sa
from alembic import context, op
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    from assembl import models as m
    with context.begin_transaction():

        op.add_column(m.LandingPageModule.__tablename__,
                      sa.Column('body_id', sa.Integer, sa.ForeignKey(m.LangString.id), nullable=True))


def downgrade(pyramid_env):
    from assembl import models as m
    with context.begin_transaction():
        op.drop_column(m.LandingPageModule.__tablename__, 'body_id')
