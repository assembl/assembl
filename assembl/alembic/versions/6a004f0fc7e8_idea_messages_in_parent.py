"""idea.messages_in_parent

Revision ID: 6a004f0fc7e8
Revises: 33b361960ee7
Create Date: 2016-10-27 12:38:08.243270

"""

# revision identifiers, used by Alembic.
revision = '6a004f0fc7e8'
down_revision = '33b361960ee7'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column('idea', sa.Column(
            "messages_in_parent", sa.Boolean, server_default='true'))
        op.add_column('idea', sa.Column(
            "message_view_override", sa.String(100)))
        op.add_column('content', sa.Column(
            "message_classifier", sa.String(100), index=True))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('idea', 'messages_in_parent')
        op.drop_column('idea', 'message_view_override')
        op.drop_column('content', "message_classifier")
