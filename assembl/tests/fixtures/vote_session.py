import pytest


@pytest.fixture(scope="function")
def vote_session(request, test_session, discussion, timeline_vote_session,
                 simple_file, admin_user):
    from assembl.models import VoteSession, VoteSessionAttachment, LangString
    vote_session = VoteSession(
        discussion_phase=timeline_vote_session,
        title=LangString.create(u"vote session fixture", "en"),
        sub_title=LangString.create(u"vote session sub title fixture", "en"),
        instructions_section_title=LangString.create(u"vote session instructions title fixture", "en"),
        instructions_section_content=LangString.create(u"vote session instructions fixture. Lorem ipsum dolor sit amet", "en"),
        propositions_section_title=LangString.create(u"vote session propositions section title fixture", "en")
    )
    header_image = VoteSessionAttachment(
        discussion=discussion,
        document=simple_file,
        vote_session=vote_session,
        title=u"vote session image fixture",
        creator=admin_user,
        attachmentPurpose='IMAGE'
    )

    test_session.add(vote_session)
    test_session.flush()

    def fin():
        print "finalizer vote_session"
        test_session.delete(header_image)
        test_session.delete(vote_session)
        test_session.flush()
    request.addfinalizer(fin)

    return vote_session
