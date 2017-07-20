"""video_desc_extended

Revision ID: 9218849f9579
Revises: ad7df254225d
Create Date: 2017-07-19 22:44:23.204035

"""

# revision identifiers, used by Alembic.
revision = '9218849f9579'
down_revision = 'ad7df254225d'

from alembic import context, op
import sqlalchemy as sa
import transaction
from assembl.lib.sqla import mark_changed


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():

        op.add_column('thematic', sa.Column('video_description_side_id',
            sa.Integer, sa.ForeignKey('langstring.id'))
        )

    with transaction.manager:
        op.execute("UPDATE thematic SET video_description_side_id=video_description_top_id")
        mark_changed()


def downgrade(pyramid_env):
    with transaction.manager:
        op.execute("UPDATE thematic SET video_description_top_id=video_description_side_id")
        mark_changed()

    with context.begin_transaction():
        op.drop_column('thematic', 'video_description_side_id')
