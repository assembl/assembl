"""unify empty langstrings

Revision ID: 2f0fc6545b35
Revises: 53b64260ffb8
Create Date: 2016-02-11 09:48:47.871958

"""

# revision identifiers, used by Alembic.
revision = '2f0fc6545b35'
down_revision = '53b64260ffb8'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config
from assembl.lib.sqla import mark_changed


def upgrade(pyramid_env):
    with context.begin_transaction():
        pass

    # This decision was reverted.
    # from assembl import models as m
    # db = m.get_session_maker()()
    # with transaction.manager:
    #     langstring_ids = db.query(m.LangStringEntry.langstring_id).join(
    #         m.LangStringEntry.locale).filter(
    #         sa.func.length(m.LangStringEntry.value) == 0,
    #         ~m.LangStringEntry.is_machine_translated).order_by(
    #             m.LangStringEntry.langstring_id).all()
    #     langstring_ids = [str(id) for (id,) in langstring_ids]

    #     if langstring_ids:
    #         first = langstring_ids.pop(0)
    #         assert first == str(m.LangString.EMPTY_ID)
    #         while len(langstring_ids):
    #             subs = ", ".join(langstring_ids[:100])
    #             db.execute("UPDATE content SET subject_id = %s WHERE subject_id IN (%s)" % (first, subs))
    #             db.execute("UPDATE content SET body_id = %s WHERE body_id IN (%s)" % (first, subs))
    #             db.execute("DELETE FROM langstring_entry WHERE langstring_id IN (%s)" % (subs,))
    #             db.execute("DELETE FROM langstring WHERE id IN (%s)" % (subs,))
    #             langstring_ids = langstring_ids[100:]
    #         mark_changed()



def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
