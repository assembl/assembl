"""update lang pref

Revision ID: 21fdae57b099
Revises: 389049a723fb
Create Date: 2016-01-10 22:33:52.998974

"""

# revision identifiers, used by Alembic.
revision = '21fdae57b099'
down_revision = '389049a723fb'

from alembic import context, op
import sqlalchemy as sa
from sqlalchemy.sql.elements import TextClause
import transaction
from assembl.lib.sqla import mark_changed

from assembl.lib import config
import logging


def delete_boolean_constraint(db, table, column):
    # The CHECK constraints are generally unnamed. 
    # Dropping the column does not delete the constraint. WHY????
    username = config.get('db_user')
    schema = config.get('db_schema')
    constraints = list(db.execute("select c_text, c_mode from db.dba.sys_constraints where c_table = '%s.%s.%s'" % (
        schema, username, table)))
    treated = set()
    for constraint_name, constraint_code in constraints:
        if constraint_name in treated:
            continue
        # column name substring would be annoying...
        if column in constraint_code:
            db.execute('alter table "%s"."%s"."%s" drop constraint "%s"' % (
                schema, username, table, constraint_name))
            treated.add(constraint_name)


def upgrade(pyramid_env):
    from assembl import models as m
    log = logging.getLogger('assembl')
    db = m.get_session_maker()()
    # Why was this not done in 368a596ab4b5_tombstone_date already?
    schema, user = config.get('db_schema'), config.get('db_user')
    # to enable delete_boolean_constraint
    admin_engine = sa.create_engine('virtuoso://dba:dba@VOSU')
    admin_engine.execute('GRANT SELECT ON DB.DBA.SYS_CONSTRAINTS TO ' + user)

    with transaction.manager:
        lang_codes = [l for (l,) in
                      db.execute("SELECT DISTINCT lang_code from user_language_preference")]
        locales = db.execute("SELECT id, code from locale")
        locale_dict = {locale_code: locale_id
                       for locale_id, locale_code in locales}  # possible because of uniqueness constraint

        for lang in lang_codes:
            if lang not in locale_dict:
                log.warn("[Migrating from %s -> %s] Language code %s is not in locale. Creating it now..."
                         % down_revision, revision, lang)
                locale = m.Locale(code=lang)
                db.add(locale)
                log.warn("[Migrating from %s -> %s] Created locale %s with id %d" % lang, locale.id)
        mark_changed()

    with context.begin_transaction():
        op.create_table(
            "user_language_preference_temp",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("user_id", sa.Integer),
            sa.Column("lang_code", sa.String),
            sa.Column("source_of_evidence", sa.Integer),
            sa.Column("locale_id", sa.Integer),
            sa.Column("explicitly_defined", sa.Boolean, server_default='0'))

    with transaction.manager:
        from assembl.models.auth import LanguagePreferenceOrder
        op.execute("""INSERT INTO user_language_preference_temp
            (id, user_id, lang_code, source_of_evidence, explicitly_defined)
            SELECT id, user_id, lang_code, preferred_order, explicitly_defined
            FROM  user_language_preference""")
        op.execute("UPDATE user_language_preference_temp SET source_of_evidence = %d \
                   WHERE explicitly_defined = 1" % (LanguagePreferenceOrder.Explicit,) )
        op.execute("DELETE FROM user_language_preference")
        locales = db.execute("SELECT id, code from locale")
        locale_dict = {locale_code: locale_id for (locale_id, locale_code) in locales}

        for lang in lang_codes:
            op.execute("UPDATE user_language_preference_temp SET locale_id = %d WHERE lang_code = '%s'" % (
                locale_dict[lang], lang))
        mark_changed()

    with context.begin_transaction():

        op.add_column(
            'user_language_preference',
            sa.Column('source_of_evidence', sa.Integer, nullable=False))
        op.add_column(
            'user_language_preference',
            sa.Column('translate_to', sa.Integer, sa.ForeignKey('locale.id'))
        )
        # Must change the lang_code column to locale based
        op.add_column(
            'user_language_preference',
            sa.Column(
                'locale_id', sa.Integer, sa.ForeignKey(
                    'locale.id', ondelete='CASCADE', onupdate='CASCADE'),
                nullable=False)
        )

        delete_boolean_constraint(db, 'user_language_preference', 'explicitly_defined')
        op.drop_column('user_language_preference', 'explicitly_defined')
        op.drop_index("%s_%s_user_language_preference_UNQC_user_id_lang_code" % (
            config.get('db_schema'), config.get('db_user')))
        op.drop_column('user_language_preference', 'lang_code')
        op.create_index(
            '%s_%s_user_language_preference_UNQC_user_id_locale_id' % (
                config.get('db_schema'), config.get('db_user')),
            'user_language_preference', ['user_id', 'locale_id'], unique=True)

    with transaction.manager:
        from assembl.models.auth import LanguagePreferenceOrder
        op.execute("""INSERT INTO user_language_preference
            (id, user_id, locale_id, source_of_evidence, preferred_order)
            SELECT id, user_id, locale_id, source_of_evidence, 0
            FROM  user_language_preference_temp""")
        mark_changed()
    with context.begin_transaction():
        op.drop_table("user_language_preference_temp")


def downgrade(pyramid_env):
    from assembl import models as m
    db = m.get_session_maker()()
    with context.begin_transaction():
        op.create_table(
            "user_language_preference_temp",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("user_id", sa.Integer),
            sa.Column("lang_code", sa.String),
            sa.Column("preferred_order", sa.Integer),
            sa.Column("locale_id", sa.Integer),
            sa.Column("explicitly_defined", sa.Boolean, server_default="0"))

    with transaction.manager:
        from assembl.models.auth import LanguagePreferenceOrder
        op.execute("""INSERT INTO user_language_preference_temp
            (id, user_id, locale_id, preferred_order)
            SELECT id, user_id, locale_id, source_of_evidence
            FROM  user_language_preference""")
        locale_ids = db.execute(
            """SELECT DISTINCT locale_id, locale.code
            FROM user_language_preference
            JOIN locale ON (locale.id=locale_id)""")
        for locale_id, locale_name in locale_ids:
            op.execute("UPDATE user_language_preference_temp SET lang_code = '%s' WHERE locale_id = %d" % (
                locale_name, locale_id))
        op.execute("""UPDATE user_language_preference_temp
            SET explicitly_defined = 1 WHERE preferred_order = %d""" % (LanguagePreferenceOrder.Explicit,))
        op.execute("DELETE FROM user_language_preference")
        mark_changed()

    with context.begin_transaction():
        op.add_column(
            'user_language_preference', sa.Column(
                'explicitly_defined', sa.Boolean, nullable=False, server_default=TextClause("0")))
        op.add_column(
            'user_language_preference', sa.Column(
                'lang_code', sa.String(), nullable=False, server_default=""))
        op.drop_index(
            '%s_%s_user_language_preference_UNQC_user_id_locale_id' % (
                config.get('db_schema'), config.get('db_user')))


        op.create_index(
            '%s_%s_user_language_preference_UNQC_user_id_lang_code' % (
                config.get('db_schema'), config.get('db_user')),
            'user_language_preference', ['user_id', 'lang_code'], unique=True)

        op.drop_column('user_language_preference', 'source_of_evidence')
        op.drop_column('user_language_preference', 'translate_to')
        op.drop_column('user_language_preference', 'locale_id')
    with transaction.manager:
        op.execute("""INSERT INTO user_language_preference
            (id, user_id, lang_code, preferred_order, explicitly_defined)
            SELECT id, user_id, lang_code, preferred_order, explicitly_defined
            FROM  user_language_preference_temp""")
        mark_changed()
    with context.begin_transaction():
        op.drop_table("user_language_preference_temp")
