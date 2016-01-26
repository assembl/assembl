"""migrate post to langstring

Revision ID: 389049a723fb
Revises: e4edf454f09
Create Date: 2015-12-22 11:16:15.894438

"""

# revision identifiers, used by Alembic.
revision = '389049a723fb'
down_revision = 'e4edf454f09'

from alembic import context, op
import sqlalchemy as sa
import transaction
from sqlalchemy.sql.expression import text
from assembl.lib.sqla import mark_changed

from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.add_column(
            "content", sa.Column(
                "subject_id", sa.Integer, sa.ForeignKey("langstring.id")))
        op.add_column(
            "content", sa.Column(
                "body_id", sa.Integer, sa.ForeignKey("langstring.id")))

    langstring_idsequence = "%s.%s.langstring_idsequence" % (
        config.get("db_schema"), config.get("db_user"))
    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        discussion_locales = db.execute(
            "select id, preferred_locales from discussion")
        discussion_locales = {
            id: (locs or 'und').split(' ')[0]
            for (id, locs) in discussion_locales}
        locales = dict(list(db.execute("select code, id from locale")))
        locale_id_for_discussion = {
            id: locales[loc] for (id, loc) in discussion_locales.iteritems()}
        for target in ("subject", "body"):
            posts = db.execute(
                "select id, discussion_id, %s from content" % target)
            for post_id, discussion_id, content in posts:
                (langstring_id,) = next(iter(db.execute(
                    "select sequence_next('%s')" % langstring_idsequence)))
                db.execute("INSERT into langstring values (%d)" % (
                    langstring_id,))
                db.execute(
                    text("""INSERT into langstring_entry (langstring_id, locale_id, value)
                    values (:langstring_id, :locale_id, :value)""").bindparams(
                        langstring_id=langstring_id,
                        locale_id=locale_id_for_discussion[discussion_id],
                        value=content))
                db.execute("UPDATE content set %s_id = %d WHERE id=%d" % (
                    target, langstring_id, post_id))
        mark_changed()
    # Note: Delay dropping content.subject, content.body until later


def downgrade(pyramid_env):
    langstring_idsequence = "%s.%s.langstring_idsequence" % (
        config.get("db_schema"), config.get("db_user"))
    with context.begin_transaction():
        op.drop_column("content", "body_id")
        op.drop_column("content", "subject_id")
        op.execute("delete from langstring_entry")
        op.execute("delete from langstring")
        op.execute("sequence_set('%s', 1, 0)" % langstring_idsequence)
        mark_changed()
