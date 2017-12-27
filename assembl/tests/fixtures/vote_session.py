import pytest


@pytest.fixture(scope="function")
def vote_session(request, discussion, test_session):
    from assembl.models import VoteSession, LangString
    vote_session = VoteSession(
        discussion=discussion,
        title=LangString.create(u"vote session fixture", "en"),
        description=LangString.create(u"vote session subtitle fixture", "en"),
        instructions_section_title=LangString.create(u"vote session instructions title fixture", "en"),
        instructions_section_content=LangString.create(u"vote session instructions fixture. Lorem ipsum dolor sit amet", "en"),
        propositions_section_title=LangString.create(u"vote session propositions section tile fixture", "en"),
        image_url=u"http://example.net/image.jpg",
    )

    test_session.add(vote_session)
    test_session.flush()

    def fin():
        print "finalizer resource"
        test_session.delete(vote_session)
        test_session.flush()
    request.addfinalizer(fin)

    return vote_session
