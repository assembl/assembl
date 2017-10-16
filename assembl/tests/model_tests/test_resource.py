def test_add_resource(admin_user, discussion, test_session):
    from assembl.models.resource import Resource
    from assembl.models import LangString

    resource = Resource(
        discussion_id=discussion.id,
        title=LangString.create(u"a resource"),
        text=LangString.create(u"Lorem ipsum dolor sit amet"),
        embed_code=u"<iframe ...>"
    )

    assert resource.title.entries[0].value == u'a resource'
    assert resource.text.entries[0].value == u'Lorem ipsum dolor sit amet'
    assert resource.embed_code == u"<iframe ...>"
