"""Landing page: Timeline is orderable

Revision ID: 0c762201e7a6
Revises: c49384fc620e
Create Date: 2019-06-27 14:58:52.028262

"""

# revision identifiers, used by Alembic.
revision = '0c762201e7a6'
down_revision = 'c49384fc620e'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        pass

    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        db.query(m.LandingPageModuleType).filter(
            m.LandingPageModuleType.identifier == m.landing_page.MODULES_IDENTIFIERS['header']
        ).one().update(orderable=True)


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass

    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        db.query(m.LandingPageModuleType).filter(
            m.LandingPageModuleType.identifier == m.landing_page.MODULES_IDENTIFIERS['header']
        ).one().update(orderable=False)

