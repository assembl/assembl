
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
