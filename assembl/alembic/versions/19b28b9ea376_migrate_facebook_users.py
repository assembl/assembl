"""migrate facebook users

Revision ID: 19b28b9ea376
Revises: 3da99691038d
Create Date: 2015-04-14 18:31:00.353728

"""

# revision identifiers, used by Alembic.
revision = '19b28b9ea376'
down_revision = '3da99691038d'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config
from assembl.lib.sqla import mark_changed

def upgrade(pyramid_env):
    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        aaat = m.AbstractAgentAccount.__table__
        q = db.query(aaat.c.id
            ).join(m.IdentityProviderAccount.__table__
            ).join(m.IdentityProvider.__table__
            ).filter(m.IdentityProvider.name == u'facebook')
        db.execute(m.FacebookAccount.__table__.insert().from_select(['id'], q))
        db.execute(aaat.update().where(
            aaat.c.id.in_(q)).values(type="facebook_account"))
        mark_changed()


def downgrade(pyramid_env):
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        aaat = m.AbstractAgentAccount.__table__
        db.execute(aaat.update().where(aaat.c.type == u'facebook_account'
            ).values(type="idprovider_agent_account"))
        db.execute('delete from facebook_account')
        mark_changed()
