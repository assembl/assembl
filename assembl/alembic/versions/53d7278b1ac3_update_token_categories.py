"""update token categories

Revision ID: 53d7278b1ac3
Revises: 1bbe7758d93e
Create Date: 2016-05-17 14:02:10.027097

"""

# revision identifiers, used by Alembic.
revision = '53d7278b1ac3'
down_revision = '1bbe7758d93e'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        # Add an empty token image.
        op.add_column('token_category_specification',
                      sa.Column('image_empty', sa.String))

        # Add a column that can contain a css color property
        # for the token category
        op.add_column('token_category_specification',
                      sa.Column('color', sa.String(25)))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('token_category_specification', 'vote_result_color')
        op.drop_column('token_category_specification', 'image_empty')
