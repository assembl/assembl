"""interface in phase

Revision ID: 5dc0a7b57c0f
Revises: 693170d95790
Create Date: 2017-09-08 09:49:46.337534

"""

# revision identifiers, used by Alembic.
revision = '5dc0a7b57c0f'
down_revision = '693170d95790'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            "discussion_phase",
            sa.Column("id", sa.Integer, sa.ForeignKey(
                "timeline_event.id",  ondelete='CASCADE', onupdate='CASCADE'),
            primary_key=True),
            sa.Column("interface_v1", sa.Boolean,
                      server_default='false', default=False))
        op.execute(
            "INSERT INTO discussion_phase (id) SELECT id FROM timeline_event")



def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table("discussion_phase")
