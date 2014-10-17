"""UserTemplate class

Revision ID: 3546c3f3020b
Revises: 287e89a8677a
Create Date: 2014-10-17 02:43:34.203879

"""

# revision identifiers, used by Alembic.
revision = '3546c3f3020b'
down_revision = '287e89a8677a'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'user_template',
            sa.Column(
                'id', sa.Integer, sa.ForeignKey(
                    'user.id', ondelete='CASCADE', onupdate='CASCADE'),
                primary_key=True),
            sa.Column(
                'discussion_id', sa.Integer, sa.ForeignKey(
                    "discussion.id", ondelete='CASCADE', onupdate='CASCADE')),
            sa.Column(
                'role_id', sa.Integer, sa.ForeignKey(
                    "role.id", ondelete='CASCADE', onupdate='CASCADE')))
        op.create_index(
            'assembl_user_template_discussion_role_index',
            'user_template', ['discussion_id', 'role_id'], unique=True)


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_index('assembl_user_template_discussion_role_index')
        op.drop_table('user_template')
