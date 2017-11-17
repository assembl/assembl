"""add_sections

Revision ID: c98a9b6f6b7f
Revises: 053f788ca313
Create Date: 2017-11-17 15:10:13.609004

"""

# revision identifiers, used by Alembic.
revision = 'c98a9b6f6b7f'
down_revision = '053f788ca313'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config
from assembl.lib.sqla_types import URLString

def upgrade(pyramid_env):
    with context.begin_transaction():
        pass

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        op.create_table(
            'section',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('type', sa.String(60), nullable=False),
            sa.Column('discussion_id',
                sa.Integer,
                sa.ForeignKey(
                  'discussion.id',
                   ondelete="CASCADE",
                   onupdate="CASCADE"), nullable=False, index=False),
            sa.Column('title_id', sa.Integer, sa.ForeignKey('langstring.id')),
            sa.Column('url', URLString(1024)),
            sa.Column('order', sa.Float, default=0.0),
            sa.Column('section_type', sa.Enum(
                'HOMEPAGE',
                'DEBATE',
                'SYNTHESES',
                'RESOURCES_CENTER',
                'CUSTOM',
                name='section_types')),
            sa.schema.UniqueConstraint('title_id')
        )

        # TODO: insert default data


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('section')
