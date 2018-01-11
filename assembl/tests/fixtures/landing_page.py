import pytest


@pytest.fixture(scope="function")
def header_landing_page_module_type(request, test_session, discussion):
    from assembl.models.landing_page import LandingPageModuleType
    header_module_type = test_session.query(LandingPageModuleType).filter(
        LandingPageModuleType.identifier == u'HEADER'
    ).one()
    return header_module_type


@pytest.fixture(scope="function")
def simple_landing_page_module(request, test_session, discussion, header_landing_page_module_type):
    from assembl.models.landing_page import LandingPageModule
    configuration = '{text:"The SDD feed is down, override the optical system so we can connect the SAS bus!"}'
    simple_landing_page_module = LandingPageModule(discussion=discussion, module_type=header_landing_page_module_type,
                                                   configuration=configuration,
                                                   order=42.0,
                                                   enabled=True)

    test_session.add(simple_landing_page_module)
    test_session.flush()

    def fin():
        print "Finalizing the simple_landing_page_module fixture"
        test_session.delete(simple_landing_page_module)
        test_session.flush()
    request.addfinalizer(fin)
    return simple_landing_page_module
