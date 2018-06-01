"""privacy_policy

Revision ID: 8d704ad414e4
Revises: ce427c9d6013
Create Date: 2018-05-31 16:14:07.049883

"""

# revision identifiers, used by Alembic.
revision = '8d704ad414e4'
down_revision = 'ce427c9d6013'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        pass

    with transaction.manager:
        op.add_column(
            'discussion', sa.Column('cookies_policy_id', sa.Integer(), sa.ForeignKey('langstring.id')))
        op.add_column(
            'discussion', sa.Column('privacy_policy_id', sa.Integer(), sa.ForeignKey('langstring.id')))

        sa.schema.UniqueConstraint(
            "cookies_policy_id", "privacy_policy_id")


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column('discussion', 'privacy_policy_id')
        op.drop_column('discussion', 'cookies_policy_id')
