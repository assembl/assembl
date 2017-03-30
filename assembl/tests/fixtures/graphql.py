import pytest


@pytest.fixture(scope="function")
def graphql_request(request, test_adminuser_webrequest, discussion):
    req = test_adminuser_webrequest
    req.matchdict = {"discussion_id": discussion.id}
    return req
