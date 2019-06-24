import pytest


@pytest.fixture(scope="function")
def header_landing_page_module_type(request, test_session, discussion):
    from assembl.models.landing_page import LandingPageModuleType, MODULES_IDENTIFIERS

    header_module_type = test_session.query(LandingPageModuleType).filter(
        LandingPageModuleType.identifier == MODULES_IDENTIFIERS['header']
    ).one()
    return header_module_type


@pytest.fixture(scope="function")
def text_and_multimedia_landing_page_module_type(request, test_session, discussion):
    from assembl.models.landing_page import LandingPageModuleType, MODULES_IDENTIFIERS
    header_module_type = test_session.query(LandingPageModuleType).filter(
        LandingPageModuleType.identifier == MODULES_IDENTIFIERS['introduction']
    ).one()
    return header_module_type


@pytest.fixture(scope="function")
def footer_landing_page_module_type(request, test_session, discussion):
    from assembl.models.landing_page import LandingPageModuleType, MODULES_IDENTIFIERS
    footer_module_type = test_session.query(LandingPageModuleType).filter(
        LandingPageModuleType.identifier == MODULES_IDENTIFIERS['footer']
    ).one()
    return footer_module_type


def landing_page_module(discussion, test_session, request, module_type, order=42):
    from assembl.models.landing_page import LandingPageModule
    configuration = '{text:"The SDD feed is down, override the optical system so we can connect the SAS bus!"}'
    lpm = LandingPageModule(discussion=discussion,
                            module_type=module_type,
                            configuration=configuration,
                            order=order,
                            enabled=True)

    test_session.add(lpm)
    test_session.flush()

    def fin():
        test_session.delete(lpm)
        test_session.flush()

    request.addfinalizer(fin)

    return lpm


@pytest.fixture(scope="function")
def simple_landing_page_module(request, test_session, discussion, header_landing_page_module_type):
    return landing_page_module(discussion, test_session, request, module_type=header_landing_page_module_type)


@pytest.fixture(scope="function")
def text_and_multimedia_landing_page_module(request, test_session, discussion,
                                            text_and_multimedia_landing_page_module_type):
    from assembl.models import LangString
    module = landing_page_module(discussion, test_session, request,
                                 module_type=text_and_multimedia_landing_page_module_type)

    module.title = LangString.create(u"Multimedia title EN", "en")
    module.body = LangString.create(u"Multimedia body EN", "en")

    test_session.flush()
    return module


@pytest.fixture(scope="function")
def footer_landing_page_module(request, test_session, discussion, footer_landing_page_module_type):
    return landing_page_module(discussion, test_session, request,
                               module_type=footer_landing_page_module_type)
