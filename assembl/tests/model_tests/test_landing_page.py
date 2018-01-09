
def test_creation_landing_page_module_type(test_session):
    from assembl.models.landing_page import LandingPageModuleType
    from assembl.models import LangString
    module_type = LandingPageModuleType(
        title=LangString.create(u"my landing page module", "en"), editable_order=False, default_order=1.0, required=True, helper_img_url=u"www.jacklayton.com/jacklayton/monimage.jpeg")
    assert module_type.title.entries[0].value == u"my landing page module"
    assert module_type.title.entries[0].locale_code == "en"
    assert module_type.editable_order is False
    assert module_type.default_order == 1.0
    assert module_type.required is True
    assert module_type.helper_img_url == u"www.jacklayton.com/jacklayton/monimage.jpeg"


def test_landing_page_module_type_populate_db(test_session):
    from assembl.models.landing_page import LandingPageModuleType
    LandingPageModuleType.populate_db(test_session)
    module_types = test_session.query(LandingPageModuleType).all()
    assert len(module_types) == 11
    for module_type in module_types:
        if module_type.identifier == 'HEADER':
            assert module_type.default_order == 1.0

        if module_type.identifier == 'FOOTER':
            assert module_type.default_order == 99.0

        test_session.delete(module_type)
