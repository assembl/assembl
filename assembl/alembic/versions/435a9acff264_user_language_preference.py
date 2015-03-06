"""user_language_preference

Revision ID: 435a9acff264
Revises: 3958ac5b0665
Create Date: 2015-02-27 16:57:12.697921

"""

# revision identifiers, used by Alembic.
revision = '435a9acff264'
down_revision = '3958ac5b0665'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'user_language_preference',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('user_id', sa.Integer, sa.ForeignKey(
                      'user.id',
                      ondelete='CASCADE',
                      onupdate='CASCADE')),
            sa.Column('lang_code', sa.String(), nullable=False),
            sa.Column('preferred_order', sa.Integer, nullable=False),
            sa.Column('explicitly_defined', sa.Boolean, nullable=False,
                      server_default='0'),
            sa.schema.UniqueConstraint('user_id', 'lang_code')
            )

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('user_language_preference')
