"""no reuse langstring

Revision ID: 3cc1683d2f24
Revises: 4e06ad70101a
Create Date: 2016-03-08 10:21:16.409561

"""

# revision identifiers, used by Alembic.
revision = '3cc1683d2f24'
down_revision = '4e06ad70101a'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.execute(
            'UPDATE langstring_entry SET value=NULL WHERE length("value")=0')

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        data = list(db.execute(
            """SELECT content.subject_id, content.id
            FROM content
            WHERE subject_id in (
                SELECT subject_id FROM content
                GROUP BY subject_id HAVING count(id) > 1)"""))
        data.sort()
        original_ls = None
        original_ls_id = None
        for subject_id, content_id in data:
            if original_ls_id != subject_id:
                original_ls_id = subject_id
                original_ls = m.LangString.get(subject_id)
                continue
            new_langstring = original_ls.clone(db)
            db.flush()
            db.execute("UPDATE content SET subject_id = %d WHERE id = %d" % (
                new_langstring.id, content_id))


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.execute(
            """UPDATE langstring_entry SET "value"='' WHERE value IS NULL""")
