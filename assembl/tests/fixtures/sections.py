# -*- coding: utf-8 -*-
import pytest


@pytest.fixture(scope="function")
def sections(request, discussion, test_session):
    """Create default sections."""
    from assembl.models import Section, LangString
    from assembl.models.section import SectionTypesEnum
    discussion_id = discussion.id

    sections = []
    homepage_section = Section(
        discussion_id=discussion_id,
        title=LangString.create(u'Home', 'en'),
        section_type=SectionTypesEnum.HOMEPAGE.value,
        order=0.0
    )
    sections.append(homepage_section)
    debate_section = Section(
        discussion_id=discussion_id,
        title=LangString.create(u'Debate', 'en'),
        section_type=SectionTypesEnum.DEBATE.value,
        order=1.0
    )
    sections.append(debate_section)
    syntheses_section = Section(
        discussion_id=discussion_id,
        title=LangString.create(u'Syntheses', 'en'),
        section_type=SectionTypesEnum.SYNTHESES.value,
        order=2.0
    )
    sections.append(syntheses_section)
    resources_center_section = Section(
        discussion_id=discussion_id,
        title=LangString.create(u'Resources center', 'en'),
        section_type=SectionTypesEnum.RESOURCES_CENTER.value,
        order=3.0
    )
    sections.append(resources_center_section)

    administration_section = Section(
        discussion_id=discussion_id,
        title=LangString.create(u'Administration', 'en'),
        section_type=SectionTypesEnum.ADMINISTRATION.value,
        order=99.0
    )
    sections.append(administration_section)

    # also add a custom section
    custom_section = Section(
        discussion_id=discussion_id,
        title=LangString.create(u'GNU is not Unix', 'en'),
        url=u'http://www.gnu.org',
        section_type=SectionTypesEnum.CUSTOM.value,
        order=4.0
    )
    sections.append(custom_section)

    for section in sections:
        test_session.add(section)
    test_session.flush()

    def fin():
        print "finalizer sections"
        for section in sections:
            test_session.delete(section)
        test_session.flush()
    request.addfinalizer(fin)

    return sections
