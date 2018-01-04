# -*- coding=utf-8 -*es
"""add_ja_ru_cn_to_sections_titles

Revision ID: c67bcb5d6faa
Revises: c3f8bc9c75d5
Create Date: 2018-01-03 16:19:22.645965

"""
from alembic import context
import transaction

# revision identifiers, used by Alembic.
revision = 'c67bcb5d6faa'
down_revision = 'c3f8bc9c75d5'


def add_values_to_section_titles(new_values):
    """Add new values to the section titles using given new_values mapping."""
    from assembl.models.langstrings import LangString
    from assembl.models.section import Section
    with Section.default_db.no_autoflush as db:
        langstrings = db.query(LangString).join(
            Section, Section.title_id == LangString.id
        ).all()
        for langstring in langstrings:
            section_type = langstring.section_from_title.one().section_type
            values_to_add = new_values.get(section_type, [])
            for value, code in values_to_add:
                for lse in langstring.entries:
                    current_locales = [lse.locale.code for lse in langstring.entries if lse.locale]
                    if code not in current_locales:
                        langstring.add_value(value, code)

            db.flush()


def upgrade(pyramid_env):
    with context.begin_transaction():
        pass

    # Do stuff with the app's models here.
    from assembl.models.section import SectionTypesEnum

    new_values = {
        SectionTypesEnum.HOMEPAGE.value: [
            (u"ホーム", 'ja'),
            (u"Главная", 'ru'),
            (u"主页", 'zh_CN'),
        ],
        SectionTypesEnum.DEBATE.value: [
            (u"討論", 'ja'),
            (u"обсуждение", 'ru'),
            (u"讨论", 'zh_CN'),
        ],
        SectionTypesEnum.SYNTHESES.value: [
            (u"シンセシス", 'ja'),
            (u"Синтезы", 'ru'),
            (u"合成", 'zh_CN'),
        ],
        SectionTypesEnum.RESOURCES_CENTER.value: [
            (u"リソース", 'ja'),
        ],
        SectionTypesEnum.ADMINISTRATION.value: [
            (u"管理", 'ja'),
            (u"администрация", 'ru'),
            (u"管理者", 'zh_CN'),
        ]
    }

    with transaction.manager:
        add_values_to_section_titles(new_values)


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
