def en_value(lang_string):
    return lang_string.entries[0].value

def test_vote_session(vote_session):
    assert (en_value(vote_session.discussion_phase.title)
        == u"token vote fixture")
    assert (en_value(vote_session.discussion_phase.description)
        == u"token vote subtitle fixture")
    assert (en_value(vote_session.instructions_section_title)
        == u"vote session instructions title fixture")
    assert (en_value(vote_session.instructions_section_content)
        == u"vote session instructions fixture. Lorem ipsum dolor sit amet")
    assert (en_value(vote_session.propositions_section_title)
        == u"vote session propositions section tile fixture")
    assert vote_session.discussion_phase.image_url == u"https://example.net/image.jpg"