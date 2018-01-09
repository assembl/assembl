def en_value(lang_string):
    return lang_string.entries[0].value

def test_vote_session(vote_session):
    assert (en_value(vote_session.title)
        == u"vote session fixture")
    assert (en_value(vote_session.sub_title)
        == u"vote session sub title fixture")
    assert (en_value(vote_session.instructions_section_title)
        == u"vote session instructions title fixture")
    assert (en_value(vote_session.instructions_section_content)
        == u"vote session instructions fixture. Lorem ipsum dolor sit amet")
    assert (en_value(vote_session.propositions_section_title)
        == u"vote session propositions section title fixture")
    assert (vote_session.attachments[0].title == u"vote session image fixture")
