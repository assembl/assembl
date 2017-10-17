# -*- coding: utf-8 -*-
import pytest


@pytest.fixture(scope="function")
def resource(request, discussion, test_session):
    from assembl.models import Resource, LangString
    resource = Resource(
        discussion=discussion,
        title=LangString.create(u"a resource"),
        text=LangString.create(u"Lorem ipsum dolor sit amet"),
        embed_code=u"<iframe ...>"
    )

    test_session.add(resource)
    test_session.flush()

    def fin():
        print "finalizer resource"
        test_session.delete(resource)
        test_session.flush()
    request.addfinalizer(fin)

    return resource
