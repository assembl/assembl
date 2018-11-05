# -*- coding: utf-8 -*-
"""Basic infrastructure for alembic migration"""
from __future__ import absolute_import

import sys

from alembic.config import Config
from alembic.migration import MigrationContext
from alembic.script import ScriptDirectory

from ..lib.sqla import (
    get_metadata, get_session_maker, mark_changed)


def bootstrap_db(config_uri=None, with_migration=True):
    """Bring a blank database to a functional state."""

    db = get_session_maker()

    if with_migration:
        context = MigrationContext.configure(db().connection())
        db_version = context.get_current_revision()

        if db_version:
            sys.stderr.write('Database already initialized. Bailing out.\n')
            sys.exit(0)

        config = Config(config_uri)
        script_dir = ScriptDirectory.from_config(config)
        heads = script_dir.get_heads()

        if len(heads) > 1:
            sys.stderr.write('Error: migration scripts have more than one '
                             'head.\nPlease resolve the situation before '
                             'attempting to bootstrap the database.\n')
            sys.exit(2)

    import assembl.models
    get_metadata().create_all(db().connection())

    # Clean up the sccoped session to allow a later app instantiation.
    if with_migration and heads:
        context = MigrationContext.configure(db().connection())
        context._ensure_version_table()
        # The latter step seems optional?
        # I am unclear as to why we'd migrate after creating tables
        # on a clean database.
        context.stamp(script_dir, heads[0])
    return db


def bootstrap_db_data(db, mark=True):
    # import after session to delay loading of BaseOps
    from assembl.models import (
        Permission, Role, IdentityProvider, Locale, LandingPageModuleType,
        LocaleLabel, ExtractNatureVocabulary, ExtractActionVocabulary, User)
    from assembl.lib.database_functions import ensure_functions
    session = db()
    for cls in (Permission, Role, IdentityProvider, Locale, LocaleLabel,
                LandingPageModuleType, ExtractNatureVocabulary, ExtractActionVocabulary,
                User):
        cls.populate_db(session)
    ensure_functions(session)
    if mark:
        mark_changed(session)
    session.flush()


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
