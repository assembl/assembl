# -*- coding: utf-8 -*-
import pytest


@pytest.fixture(scope="function")
def sections(request, discussion_with_default_data, test_session):
    """Create default sections."""
    from assembl.models import Section, LangString
    from assembl.models.section import SectionTypesEnum
    discussion_id = discussion_with_default_data.id

    # default sections are created in the discussion_with_default_data fixture
    # via create_default_discussion_data

    sections = []
    # add a custom section
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
