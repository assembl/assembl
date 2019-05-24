from assembl.models import RootIdea

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

def test_get_root_idea(subidea_1_1, test_session):
    root_idea = subidea_1_1.get_root_idea()
    assert isinstance(root_idea, RootIdea)
    assert root_idea in subidea_1_1.get_all_ancestors()

def test_get_root_idea_from_multiple_subideas(subidea_1_1, subidea_1_2, subidea_1_1_1, test_session):
    root_idea_1_1 = subidea_1_1.get_root_idea()
    root_idea_1_2 = subidea_1_2.get_root_idea()
    root_idea_1_1_1 = subidea_1_1_1.get_root_idea()
    assert root_idea_1_1 == root_idea_1_2
    assert root_idea_1_1 == root_idea_1_1_1

def test_get_root_idea_from_root_idea(root_idea, test_session):
    root_idea_2 = root_idea.get_root_idea()
    assert root_idea_2 == root_idea
