"""duplicate UserLocalRoles

Revision ID: 3eb0fa36d60a
Revises: 43863df11763
Create Date: 2015-05-30 11:55:51.591390

"""

# revision identifiers, used by Alembic.
revision = '3eb0fa36d60a'
down_revision = '43863df11763'

from collections import defaultdict

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        ulrs = db.query(m.LocalUserRole).all()
        ulrs_k = defaultdict(list)
        def key(ulr):
            return (ulr.user_id, ulr.discussion_id, ulr.role_id)
        for ulr in ulrs:
            ulrs_k[key(ulr)].append(ulr)
        for kl in ulrs_k.values():
            if len(kl) > 1:
                kl.sort(key = lambda m: m.id)
                for ulr in kl[1:]:
                    ulr.delete()

def downgrade(pyramid_env):
    pass
