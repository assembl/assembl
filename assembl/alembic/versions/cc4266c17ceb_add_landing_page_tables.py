"""add_landing_page_tables

Revision ID: cc4266c17ceb
Revises: c14c885ecdc2
Create Date: 2018-01-09 15:52:07.323894

"""

# revision identifiers, used by Alembic.
revision = 'cc4266c17ceb'
down_revision = 'c14c885ecdc2'

from alembic import context, op
import sqlalchemy as sa
import transaction

from assembl.lib import config
from assembl.lib.sqla_types import URLString


def upgrade(pyramid_env):
    with context.begin_transaction():
        pass

    # Do stuff with the app's models here.
    from assembl import models as m

    db = m.get_session_maker()()
    with transaction.manager:
        # create landing_page_module_type table
        op.create_table(
            'landing_page_module_type',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('type', sa.String(60), nullable=False),
            sa.Column('identifier', sa.String(30), nullable=False),
            sa.Column("title_id", sa.Integer, sa.ForeignKey("langstring.id")),
            sa.Column('helper_img_url', URLString(1024)),
            sa.Column('default_order', sa.Float, nullable=False),
            sa.Column('editable_order', sa.Boolean, default=True),
            sa.Column('required', sa.Boolean, default=False),
            sa.schema.UniqueConstraint("title_id")
        )


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_table('landing_page_module_type')
