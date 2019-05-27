import pytest

def test_add_semantic_analysis_tab_to_all_discussions(discussion):
    from assembl.lib.migration import add_semantic_analysis_tab_to_all_discussions
    from assembl import models as m
    from assembl.models.section import SectionTypesEnum

    add_semantic_analysis_tab_to_all_discussions(discussion.db)

    discussion_sections = discussion.db.query(m.Section).filter(m.Section.discussion_id == discussion.id).all()
    assert len([section.section_type for section in discussion_sections if section.section_type == SectionTypesEnum.SEMANTIC_ANALYSIS.value]) == 1


def test_add_semantic_analysis_tab_to_all_discussions_already_added(discussion_with_default_data):
    from assembl.lib.migration import add_semantic_analysis_tab_to_all_discussions
    from assembl import models as m
    from assembl.models.section import SectionTypesEnum

    add_semantic_analysis_tab_to_all_discussions(discussion_with_default_data.db)

    discussion_sections = discussion_with_default_data.db.query(m.Section).filter(m.Section.discussion_id == discussion_with_default_data.id).all()
    assert len([section.section_type for section in discussion_sections if section.section_type == SectionTypesEnum.SEMANTIC_ANALYSIS.value]) == 1
