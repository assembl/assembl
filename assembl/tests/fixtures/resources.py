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


@pytest.fixture(scope="function")
def resource_with_image_and_doc(request, discussion, moderator_user, simple_file, test_session):
    from assembl.models import Resource, LangString
    from assembl.models.attachment import ResourceAttachment
    resource = Resource(
        discussion=discussion,
        title=LangString.create(u"another resource"),
        text=LangString.create(u"Lorem ipsum dolor sit amet"),
        embed_code=u""
    )
    resource_image = ResourceAttachment(
        discussion=discussion,
        document=simple_file,
        resource=resource,
        title=u"Resource image",
        creator=moderator_user,
        attachmentPurpose='IMAGE'
    )

    resource_doc = ResourceAttachment(
        discussion=discussion,
        document=simple_file,
        resource=resource,
        title=u"Resource document",
        creator=moderator_user,
        attachmentPurpose='DOCUMENT'
    )

    test_session.add(resource)
    test_session.flush()

    def fin():
        print "finalizer resource"
        test_session.delete(resource_doc)
        test_session.delete(resource_image)
        test_session.delete(resource)
        test_session.flush()
    request.addfinalizer(fin)

    return resource
