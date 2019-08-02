# -*- coding: utf-8 -*-
"""Basic infrastructure for alembic migration"""
from __future__ import absolute_import

import sys
from contextlib import contextmanager

import simplejson as json
from alembic.config import Config
from alembic.migration import MigrationContext
from alembic.environment import EnvironmentContext
from alembic.script import ScriptDirectory
import transaction

from ..lib.sqla import (
    get_metadata, get_session_maker, mark_changed)
from ..lib import config


def has_tables(db):
    (num_tables,) = db.query(
        """COUNT(table_name) FROM information_schema.tables
        WHERE table_schema='public'""").first()
    # don't count alembic
    return num_tables > 1


@contextmanager
def locked_transaction(db, num):
    # use a pg_advisory_lock to make sure that the transaction is locked.
    # Do it on another connection, so errors will not leave the lock dangling.
    cnx = db.session_factory.kw['bind'].connect()
    cnx.execute("select pg_advisory_lock(%d)" % num).first()
    try:
        with transaction.manager:
            session = db()
            yield session
            mark_changed(session)
    finally:
        cnx.execute("select pg_advisory_unlock(%d)" % num)
        cnx.close()


def bootstrap_db(config_uri, with_migration=True):
    """Bring a blank database to a functional state."""
    config = Config(config_uri)
    script_dir = ScriptDirectory.from_config(config)
    heads = script_dir.get_heads()

    if len(heads) > 1:
        sys.stderr.write('Error: migration scripts have more than one '
                         'head.\nPlease resolve the situation before '
                         'attempting to bootstrap the database.\n')
        sys.exit(2)
    elif len(heads) == 0:
        sys.stderr.write('Error: migration scripts have no head.\n')
        sys.exit(2)
    head = heads[0]
    db = get_session_maker()
    db.flush()
    if not has_tables(db()):
        with locked_transaction(db, 1234) as session:
            context = MigrationContext.configure(session.connection())
            if not has_tables(session):
                import assembl.models
                get_metadata().create_all(session.connection())
                assert has_tables(session)
                context._ensure_version_table()
                context.stamp(script_dir, head)
    elif with_migration:
        context = MigrationContext.configure(db().connection())
        db_version = context.get_current_revision()
        # artefact: in tests, db_version may be none.
        if db_version and db_version != head:
            with locked_transaction(db, 1235) as session:
                context = MigrationContext.configure(session.connection())
                db_version = context.get_current_revision()
                if db_version != head:
                    with EnvironmentContext(
                        config,
                        script_dir,
                        as_sql=False,
                        fn=lambda heads, context: script_dir._upgrade_revs(head, db_version),
                        destination_rev=head
                    ):
                        script_dir.run_env()
            context = MigrationContext.configure(db().connection())
            db_version = context.get_current_revision()
            assert db_version == head
    return db


def bootstrap_db_data(db, mark=True):
    # import after session to delay loading of BaseOps
    from assembl.models import (
        Permission, Role, IdentityProvider, Locale, LandingPageModuleType,
        LocaleLabel, ExtractNatureVocabulary, ExtractActionVocabulary, User)
    from assembl.lib.database_functions import ensure_functions
    with locked_transaction(db, 1236) as session:
        for cls in (Permission, Role, IdentityProvider, Locale, LocaleLabel,
                    LandingPageModuleType, ExtractNatureVocabulary, ExtractActionVocabulary,
                    User):
            cls.populate_db(session)
        ensure_functions(session)
        admin_users = config.get('admin_users', None)
        if admin_users:
            from assembl.auth.util import add_user
            from pyramid.exceptions import ConfigurationError
            try:
                admin_users = json.loads(admin_users)
                for user in admin_users:
                    name = user.pop('name', None)
                    email = user.pop('email', None)
                    if not (name and email):
                        continue
                    try:
                        add_user(name, email, **user)
                    except AssertionError as e:
                        print e
            except ConfigurationError:
                pass  # no application. It can be done later.
        # if mark:
        mark_changed(session)


def bootstrap_indexing(db):
    from assembl.indexing import indexing_active
    from assembl.indexing.utils import check_mapping, maybe_create_and_reindex
    if not indexing_active():
        return
    index_name = config.get('elasticsearch_index')
    if not check_mapping(index_name):
        with locked_transaction(db, 1237) as session:
            maybe_create_and_reindex(index_name, session)


def ensure_db_version(config_uri, session_maker):
    """Exit if database is not up-to-date."""
    config = Config(config_uri)
    script_dir = ScriptDirectory.from_config(config)
    heads = script_dir.get_heads()

    if len(heads) > 1:
        sys.stderr.write('Error: migration scripts have more than one head.\n'
                         'Please resolve the situation before attempting to '
                         'start the application.\n')
        sys.exit(2)
    else:
        repo_version = heads[0] if heads else None

    context = MigrationContext.configure(session_maker()().connect())
    db_version = context.get_current_revision()

    if not db_version:
        sys.stderr.write('Database not initialized.\n'
                         'Try this: "assembl-db-manage %s bootstrap".\n'
                         % config_uri)
        sys.exit(2)

    if db_version != repo_version:
        sys.stderr.write('Stopping: DB version (%s) not up-to-date (%s).\n'
                         % (db_version, repo_version))
        sys.stderr.write('Try this: "assembl-db-manage %s upgrade head".\n'
                         % config_uri)
        sys.exit(2)


def is_migration_script():
    """Determine weather the current process is a migration script."""
    return 'alembic' in sys.argv[0] or 'assembl-db-manage' in sys.argv[0]


def create_default_discussion_sections(discussion):
    from assembl import models as m
    from assembl.models.section import SectionTypesEnum
    db = discussion.db
    langstring = m.LangString.create(u'Home', 'en')
    langstring.add_value(u'Accueil', 'fr')
    langstring.add_value(u"ホーム", 'ja')
    langstring.add_value(u"Главная", 'ru')
    langstring.add_value(u"主页", 'zh_CN')

    homepage_section = m.Section(
        discussion=discussion,
        title=langstring,
        section_type=SectionTypesEnum.HOMEPAGE.value,
        order=0.0
    )
    db.add(homepage_section)

    langstring = m.LangString.create(u'Debate', 'en')
    langstring.add_value(u'Débat', 'fr')
    langstring.add_value(u"討論", 'ja')
    langstring.add_value(u"обсуждение", 'ru')
    langstring.add_value(u"讨论", 'zh_CN')
    debate_section = m.Section(
        discussion=discussion,
        title=langstring,
        section_type=SectionTypesEnum.DEBATE.value,
        order=1.0
    )
    db.add(debate_section)

    langstring = m.LangString.create(u'Syntheses', 'en')
    langstring.add_value(u'Synthèses', 'fr')
    langstring.add_value(u"シンセシス", 'ja')
    langstring.add_value(u"Синтезы", 'ru')
    langstring.add_value(u"合成", 'zh_CN')
    syntheses_section = m.Section(
        discussion=discussion,
        title=langstring,
        section_type=SectionTypesEnum.SYNTHESES.value,
        order=2.0
    )
    db.add(syntheses_section)

    langstring = m.LangString.create(u'Resources center', 'en')
    langstring.add_value(u'Ressources', 'fr')
    langstring.add_value(u"リソース", 'ja')
    resources_center_section = m.Section(
        discussion=discussion,
        title=langstring,
        section_type=SectionTypesEnum.RESOURCES_CENTER.value,
        order=3.0
    )
    db.add(resources_center_section)

    langstring = m.LangString.create(u'Semantic analysis', 'en')
    langstring.add_value(u'Analyse sémantique', 'fr')
    langstring.add_value(u"意味解析", 'ja')
    langstring.add_value(u"Семантический анализ", 'ru')
    langstring.add_value(u"语义分析", 'zh_CN')
    semantic_analysis_section = m.Section(
        discussion=discussion,
        title=langstring,
        section_type=SectionTypesEnum.SEMANTIC_ANALYSIS.value,
        order=4.0
    )
    db.add(semantic_analysis_section)

    langstring = m.LangString.create(u'Administration', 'en')
    langstring.add_value(u'Administration', 'fr')
    langstring.add_value(u"管理", 'ja')
    langstring.add_value(u"администрация", 'ru')
    langstring.add_value(u"管理者", 'zh_CN')
    administration_section = m.Section(
        discussion=discussion,
        title=langstring,
        section_type=SectionTypesEnum.ADMINISTRATION.value,
        order=99.0
    )
    db.add(administration_section)


def create_default_discussion_profile_fields(discussion):
    from assembl import models as m
    from assembl.models.configurable_fields import ConfigurableFieldIdentifiersEnum, TextFieldsTypesEnum
    db = discussion.db
    title = m.LangString.create('Fullname', 'en')
    title.add_value(u'Nom complet', 'fr')
    fullname_field = m.TextField(
        discussion=discussion,
        identifier=ConfigurableFieldIdentifiersEnum.FULLNAME.value,
        order=1.0,
        title=title,
        required=True
    )
    db.add(fullname_field)

    title = m.LangString.create('Username', 'en')
    title.add_value(u"Nom d'utilisateur", 'fr')
    username_field = m.TextField(
        discussion=discussion,
        identifier=ConfigurableFieldIdentifiersEnum.USERNAME.value,
        order=2.0,
        title=title,
        required=True
    )
    db.add(username_field)

    title = m.LangString.create('Email', 'en')
    title.add_value(u'Courriel', 'fr')
    email_field = m.TextField(
        discussion=discussion,
        field_type=TextFieldsTypesEnum.EMAIL.value,
        identifier=ConfigurableFieldIdentifiersEnum.EMAIL.value,
        order=3.0,
        title=title,
        required=True
    )
    db.add(email_field)

    title = m.LangString.create('Password', 'en')
    title.add_value(u'Mot de passe', 'fr')
    password_field = m.TextField(
        discussion=discussion,
        field_type=TextFieldsTypesEnum.PASSWORD.value,
        identifier=ConfigurableFieldIdentifiersEnum.PASSWORD.value,
        order=4.0,
        title=title,
        required=True
    )
    db.add(password_field)

    title = m.LangString.create('Password (confirm)', 'en')
    title.add_value(u'Confirmation de mot de passe', 'fr')
    password2_field = m.TextField(
        discussion=discussion,
        field_type=TextFieldsTypesEnum.PASSWORD.value,
        identifier=ConfigurableFieldIdentifiersEnum.PASSWORD2.value,
        order=5.0,
        title=title,
        required=True
    )
    db.add(password2_field)


def create_default_discussion_data(discussion):
    from ..models.auth import create_default_permissions
    create_default_permissions(discussion)
    create_default_discussion_sections(discussion)
    create_default_discussion_profile_fields(discussion)


def includeme(config):
    """Initialize Alembic-related stuff at app start-up time."""
    skip_migration = config.registry.settings.get('app.skip_migration')
    if not skip_migration and not is_migration_script():
        ensure_db_version(
            config.registry.settings['config_uri'], get_session_maker())


def add_semantic_analysis_tab_to_all_discussions(db):
    """Add the section to all discussions that hasn't been initialized with it"""
    import transaction
    from assembl import models as m
    from assembl.models.section import SectionTypesEnum

    with transaction.manager:
        discussions = db.query(m.Discussion).all()
        for discussion in discussions:
            sections = db.query(m.Section).filter(m.Section.discussion_id == discussion.id).all()

            if SectionTypesEnum.SEMANTIC_ANALYSIS.value not in [section.section_type for section in sections]:
                langstring = m.LangString.create(u'Semantic analysis', 'en')
                langstring.add_value(u'Analyse sémantique', 'fr')
                langstring.add_value(u"意味解析", 'ja')
                langstring.add_value(u"Семантический анализ", 'ru')
                langstring.add_value(u"语义分析", 'zh_CN')
                semantic_analysis_section = m.Section(
                    discussion=discussion,
                    title=langstring,
                    section_type=SectionTypesEnum.SEMANTIC_ANALYSIS.value,
                    order=4.0
                )
                db.add(semantic_analysis_section)
                db.flush()


def semantic_analyze_all_posts(db, discussion_id=None):
    """Analyze semantically all posts of discussions"""
    from assembl import models as m
    from assembl.processes.watson import process_post_watson
    if discussion_id:
        discussions = [m.Discussion.get([discussion_id])]
    else:
        discussions = db.query(m.Discussion).all()
    for discussion in discussions:
        posts = discussion.db.query(m.Post).filter(m.Post.discussion_id == discussion.id).all()
        for p in posts:
            with transaction.manager:
                process_post_watson(p.id, True)
