"""delete old subject/body

Revision ID: 50639b470b96
Revises: 358edeb4135c
Create Date: 2016-01-27 17:44:29.234540

"""

# revision identifiers, used by Alembic.
revision = '50639b470b96'
down_revision = '358edeb4135c'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config
from assembl.lib.sqla import mark_changed


def upgrade(pyramid_env):
    with context.begin_transaction():
        # Virtuoso will corrupt the database if the body is
        # not nulled before dropping. Setting it to '' is not enough.
        # (Does not matter for subject column, for some reason. LONG NVARCHAR?)
        op.execute("update content set subject=null, body=null")
    with context.begin_transaction():
        op.drop_column("content", "body")
        op.drop_column("content", "subject")


def downgrade(pyramid_env):
    # with context.begin_transaction():
    #     op.add_column("content", sa.Column(
    #         "subject", sa.Unicode, server_default=""))
    #     op.add_column("content", sa.Column(
    #         "body", sa.UnicodeText, server_default=""))
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        for target in ("subject", "body"):
            r = db.execute(
                """select content.id, langstring_entry.value from content
                join langstring_entry
                    on content.{0}_id = langstring_entry.langstring_id
                join locale on langstring_entry.locale_id = locale.id
                where locale.code not like '%-x-mtfrom-%'""".format(target))
            for id, text in r:
                if len(text):
                    db.execute("UPDATE content set %s = :txt WHERE id= :id" % (
                        (target,)), dict(txt=text, id=id))
        mark_changed()
