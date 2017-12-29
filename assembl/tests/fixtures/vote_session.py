import pytest


@pytest.fixture(scope="function")
def vote_session(request, test_session, timeline_token_vote):
    from assembl.models import VoteSession, LangString
    vote_session = VoteSession(
        discussion_phase=timeline_token_vote,
        instructions_section_title=LangString.create(u"vote session instructions title fixture", "en"),
        instructions_section_content=LangString.create(u"vote session instructions fixture. Lorem ipsum dolor sit amet", "en"),
        propositions_section_title=LangString.create(u"vote session propositions section tile fixture", "en")
    )

    test_session.add(vote_session)
    test_session.flush()

    def fin():
        print "finalizer resource"
        test_session.delete(vote_session)
        test_session.flush()
    request.addfinalizer(fin)

    return vote_session
