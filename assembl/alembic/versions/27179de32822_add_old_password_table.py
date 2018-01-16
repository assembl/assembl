"""Add old_password table

Revision ID: 27179de32822
Revises: 7ea03fbce9a8
Create Date: 2018-01-16 11:28:57.145335

"""

# revision identifiers, used by Alembic.
revision = '27179de32822'
down_revision = '7ea03fbce9a8'

from alembic import context, op
import sqlalchemy as sa


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'old_password',
            sa.Column(
                'id',
                sa.Integer,
                primary_key=True
            ),
            sa.Column(
                'user_id',
                sa.Integer,
                sa.ForeignKey(
                    'user.id',
                    ondelete="CASCADE",
                    onupdate="CASCADE"
                ),
                nullable=False,
                index=True
            ),
            sa.Column(
                'password',
                sa.Binary(115),
            ),
        )


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('old_password')
