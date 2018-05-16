"""fix_landing_page_module_types

Revision ID: 2a7357d60fa5
Revises: 4a5c5c46d729
Create Date: 2018-05-14 15:30:47.643214

"""

# revision identifiers, used by Alembic.
revision = '2a7357d60fa5'
down_revision = '4a5c5c46d729'

from alembic import context, op
import sqlalchemy as sa
import transaction

from assembl.lib import config
from assembl.lib.sqla import mark_changed


update_string = 'UPDATE landing_page_module SET "type"=:val WHERE landing_page_module.type=:old_type'


def upgrade(pyramid_env):
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        db.execute(
            sa.text(update_string).bindparams(
                old_type='resource', val='landing_page_module')
        )
        mark_changed()


def downgrade(pyramid_env):
    with transaction.manager:
        from assembl import models as m
        db = m.get_session_maker()()
        db.execute(
            sa.text(update_string).bindparams(
                old_type='landing_page_module', val='resource')
        )
        mark_changed()
