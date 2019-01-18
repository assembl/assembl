def en_value(lang_string):
    return lang_string.entries[0].value

def test_vote_session(vote_session):
    assert (en_value(vote_session.propositions_section_title)
        == u"vote session propositions section title fixture")
