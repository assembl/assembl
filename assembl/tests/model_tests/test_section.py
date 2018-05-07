def test_add_section(admin_user, discussion, test_session):
    from assembl.models.section import Section, SectionTypesEnum
    from assembl.models import LangString

    section = Section(
        discussion_id=discussion.id,
        title=LangString.create(u"My homepage section"),
        url=u'http://www.example.com',
        section_type=SectionTypesEnum.HOMEPAGE.value,
        order=0.0
    )

    assert section.title.entries[0].value == u'My homepage section'
    assert section.url == u'http://www.example.com'
    assert section.order == 0.0
    assert section.section_type == SectionTypesEnum.HOMEPAGE.value
