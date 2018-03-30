MODULES_COUNT = 11


def test_create_landing_page_module_type(test_session):
    from assembl.models.landing_page import LandingPageModuleType
    from assembl.models import LangString
    module_type = LandingPageModuleType(
        identifier="my module",
        title=LangString.create(u"my landing page module", "en"), editable_order=False, default_order=1.0, required=True)
    test_session.add(module_type)
    test_session.flush()
    assert module_type.title.entries[0].value == u"my landing page module"
    assert module_type.title.entries[0].locale_code == "en"
    assert module_type.editable_order is False
    assert module_type.default_order == 1.0
    assert module_type.required is True
    test_session.delete(module_type)


def test_landing_page_module_types_are_populated(test_session):
    from assembl.models.landing_page import LandingPageModuleType
    module_types = test_session.query(LandingPageModuleType).all()
    assert len(module_types) == MODULES_COUNT
    for module_type in module_types:
        if module_type.identifier == 'HEADER':
            assert module_type.default_order == 1.0

        if module_type.identifier == 'FOOTER':
            assert module_type.default_order == 99.0


def test_create_landing_page_module(discussion, test_session):
    from assembl.models.landing_page import LandingPageModule
    from assembl.models.landing_page import LandingPageModuleType
    first_module_type = test_session.query(LandingPageModuleType).first()
    configuration = '{text:"The SDD feed is down, override the optical system so we can connect the SAS bus!"}'
    module = LandingPageModule(
        discussion=discussion,
        module_type=first_module_type,
        configuration=configuration,
        order=42.0,
        enabled=True
    )
    test_session.add(module)
    test_session.flush()
    assert module.enabled is True
    assert module.configuration == configuration
    assert module.order == 42.0
    assert module.discussion == discussion
    assert module.module_type.identifier == first_module_type.identifier
    test_session.delete(module)
