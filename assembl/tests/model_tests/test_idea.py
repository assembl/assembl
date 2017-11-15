def test_idea_copy(subidea_1_1, test_session):
    from datetime import datetime

    tombstone = datetime.now()
    boba_fett = subidea_1_1.copy(tombstone=tombstone, db=test_session)
    assert len(subidea_1_1.title.entries) == len(boba_fett.title.entries)
    assert (subidea_1_1.title.first_original().value ==
            boba_fett.title.first_original().value)


def test_idea_copy_and_commit(subidea_1_1, test_session):
    # This test currently fails but should not
    from datetime import datetime

    tombstone = datetime.now()
    boba_fett = subidea_1_1.copy(tombstone=tombstone, db=test_session)
    assert len(subidea_1_1.title.entries) == len(boba_fett.title.entries)
    assert (subidea_1_1.title.first_original().value ==
            boba_fett.title.first_original().value)

    test_session.commit()

    assert len(subidea_1_1.title.entries) == len(boba_fett.title.entries)
    assert (subidea_1_1.title.first_original().value ==
            boba_fett.title.first_original().value)

    # remove the cloned langstring after use
    for entry in boba_fett.title.entries:
        test_session.delete(entry)
    for entry in boba_fett.description.entries:
        test_session.delete(entry)
    test_session.delete(boba_fett)
    test_session.commit()
