"""post_user_language_preference

Revision ID: 97bc9e8e7d1a
Revises: 57c8fb47480b
Create Date: 2017-12-07 10:50:10.358418

"""

# revision identifiers, used by Alembic.
revision = '97bc9e8e7d1a'
down_revision = '57c8fb47480b'

from alembic import context, op
import sqlalchemy as sa


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'post_user_language_preference',
            sa.Column(
                'id', sa.Integer, sa.ForeignKey(
                    'user_language_preference.id',
                    ondelete='CASCADE',
                    onupdate='CASCADE'),
                primary_key=True
            ),
            sa.Column(
                'post_id', sa.Integer, sa.ForeignKey(
                    'content.id',
                    onupdate='CASCADE',
                    ondelete='CASCADE'),
                nullable=False,
                index=True
            )
        )


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('post_user_language_preference')
