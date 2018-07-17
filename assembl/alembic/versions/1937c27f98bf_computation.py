"""computation

Revision ID: 1937c27f98bf
Revises: f8a3ebc5d6dd
Create Date: 2018-07-16 17:40:54.043691

"""

# revision identifiers, used by Alembic.
revision = '1937c27f98bf'
down_revision = 'f8a3ebc5d6dd'

from alembic import context, op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM, JSONB
import transaction


from assembl.lib import config


computation_status = ENUM(
    'pending', 'success', 'failure', name="computation_status")


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            'computation_process',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('name', sa.String)
        )

        op.create_table(
            'computation',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('process_id', sa.Integer,
                      sa.ForeignKey("computation_process.id")),
            sa.Column('created', sa.DateTime),
            sa.Column('target_type', sa.String(20)),
            sa.Column('status', computation_status, server_default="pending"),
            sa.Column('retries', sa.SmallInteger),
            sa.Column('parameters', JSONB),
            sa.Column('result', JSONB),
        )
        op.create_table(
            'computation_on_post',
            sa.Column('id', sa.Integer,
                      sa.ForeignKey("computation.id"), primary_key=True),
            sa.Column('post_id', sa.Integer,
                      sa.ForeignKey("content.id"), index=True),
        )
        op.create_table(
            'computation_on_idea',
            sa.Column('id', sa.Integer,
                      sa.ForeignKey("computation.id"), primary_key=True),
            sa.Column('idea_id', sa.Integer,
                      sa.ForeignKey("idea.id"), index=True),
        )


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('computation_on_post')
        op.drop_table('computation_on_idea')
        op.drop_table('computation')
        op.drop_table('computation_process')
        op.execute('DROP TYPE IF EXISTS computation_status')
