def test_add_resource(admin_user, discussion, test_session):
    from assembl.models.resource import Resource
    from assembl.models import LangString

    resource = Resource(
        discussion_id=discussion.id,
        title=LangString.create(u"a resource"),
        text=LangString.create(u"Lorem ipsum dolor sit amet"),
        embed_code=u"<iframe ...>",
        order=3.0
    )

    assert resource.title.entries[0].value == u'a resource'
    assert resource.text.entries[0].value == u'Lorem ipsum dolor sit amet'
    assert resource.embed_code == u"<iframe ...>"
    assert resource.order == 3.0


def test_add_resource_attachment(discussion, moderator_user, simple_file, resource):
    from assembl.models.attachment import ResourceAttachment
    ra = ResourceAttachment(
        discussion=discussion,
        document=simple_file,
        resource=resource,
        title=u"Simple resource attachment",
        creator=moderator_user,
        attachmentPurpose='IMAGE'
    )

    assert ra.title == u"Simple resource attachment"
    assert ra.resource == resource
