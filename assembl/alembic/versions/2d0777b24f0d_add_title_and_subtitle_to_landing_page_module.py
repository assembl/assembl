"""add title and subtitle to landing_page_module

Revision ID: 2d0777b24f0d
Revises: d7452db4dcd2
Create Date: 2018-06-20 16:09:23.885102

"""

# revision identifiers, used by Alembic.
revision = '2d0777b24f0d'
down_revision = 'd7452db4dcd2'

from alembic import context, op
import sqlalchemy as sa


def upgrade(pyramid_env):
    from assembl import models as m
    with context.begin_transaction():
        op.add_column(
            'landing_page_module',
            sa.Column(
                'title_id',
                sa.Integer,
                sa.ForeignKey(m.LangString.id)
            )
        )
        op.add_column(
            'landing_page_module',
            sa.Column(
                'subtitle_id',
                sa.Integer,
                sa.ForeignKey(m.LangString.id)
            )
        )


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('landing_page_module', 'title_id')
        op.drop_column('landing_page_module', 'subtitle_id')
