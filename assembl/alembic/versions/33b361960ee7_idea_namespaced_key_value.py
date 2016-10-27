"""idea_namespaced_key_value

Revision ID: 33b361960ee7
Revises: 41176a6a6758
Create Date: 2016-10-27 11:59:04.092857

"""

# revision identifiers, used by Alembic.
revision = '33b361960ee7'
down_revision = '41176a6a6758'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    # schema, user = config.get('db_schema'), config.get('db_user')
    with context.begin_transaction():
        op.create_table(
            'idea_namespaced_key_value',
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("idea_id", sa.Integer, sa.ForeignKey("idea.id"), index=True),
            sa.Column("namespace", sa.String),
            sa.Column("key", sa.String),
            sa.Column("value", sa.Text),
            sa.schema.UniqueConstraint("idea_id", "namespace", "key")
        )


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('idea_namespaced_key_value')
