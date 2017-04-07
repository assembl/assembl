import pytest


@pytest.fixture(scope="function")
def graphql_request(request, test_adminuser_webrequest, discussion, fr_locale, en_locale):
    req = test_adminuser_webrequest
    req.matchdict = {"discussion_id": discussion.id}
    return req
