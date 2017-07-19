"""video_desc

Revision ID: ad7df254225d
Revises: b0a17a1c42cb
Create Date: 2017-07-15 17:32:34.582709

"""

# revision identifiers, used by Alembic.
revision = 'ad7df254225d'
down_revision = 'b0a17a1c42cb'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config
from assembl.lib.sqla import mark_changed


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('thematic', sa.Column('video_description_top_id',
            sa.Integer, sa.ForeignKey('langstring.id'))
        )

        op.add_column('thematic', sa.Column('video_description_bottom_id',
            sa.Integer, sa.ForeignKey('langstring.id'))
        )

    with transaction.manager:
        op.execute("UPDATE thematic SET video_description_top_id=video_description_id")
        mark_changed()

    with context.begin_transaction():
        op.drop_column('thematic', 'video_description_id')


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('thematic', sa.Column('video_description_id',
                      sa.Integer, sa.ForeignKey('langstring.id')))

    with transaction.manager:
        op.execute("UPDATE thematic SET video_description_id = video_description_top_id")
        mark_changed()

    with context.begin_transaction():
        op.drop_column('thematic', 'video_description_bottom_id')
        op.drop_column('thematic', 'video_description_top_id')
