"""content_source_ids

Revision ID: 475125b7bfe3
Revises: 63cb39048ef
Create Date: 2015-04-24 16:13:34.818350

"""

# revision identifiers, used by Alembic.
revision = '475125b7bfe3'
down_revision = '63cb39048ef'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table('content_source_ids',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('source_id', sa.Integer,
                      sa.ForeignKey('content_source.id',
                      onupdate='CASCADE', ondelete='CASCADE')),
            sa.Column('post_id', sa.Integer, sa.ForeignKey('content.id',
                   onupdate='CASCADE', ondelete='CASCADE')),
            sa.Column('message_id_in_source', sa.String(256), nullable=False)
        )

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('content_source_ids')
