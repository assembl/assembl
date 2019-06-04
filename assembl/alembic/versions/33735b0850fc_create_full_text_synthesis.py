"""Create full text synthesis

Revision ID: 33735b0850fc
Revises: a3dc2d6f7562
Create Date: 2019-04-30 14:35:48.558367

"""
import sqlalchemy as sa
from alembic import context, op

# revision identifiers, used by Alembic.
revision = '33735b0850fc'
down_revision = 'a3dc2d6f7562'


def upgrade(pyramid_env):
    from assembl import models as m
    with context.begin_transaction():
        op.add_column(m.FullTextSynthesis.__tablename__,
                      sa.Column('body_id', sa.Integer, sa.ForeignKey(m.LangString.id), nullable=True))


def downgrade(pyramid_env):
    from assembl import models as m
    with context.begin_transaction():
        op.drop_column(m.FullTextSynthesis.__tablename__, 'body_id')
