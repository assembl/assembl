import pytest

def test_idea_copy(subidea_1_1):
  from datetime import datetime

  tombstone = datetime.now()
  boba_fett = subidea_1_1.copy(tombstone=tombstone)
  assert len(subidea_1_1.title.entries) == len(boba_fett.title.entries)
  assert subidea_1_1.title.first_original().value == boba_fett.title.first_original().value


@pytest.mark.xfail
def test_idea_copy_and_commit(subidea_1_1, test_session):
  # This test currently fails but should not
  from datetime import datetime

  tombstone = datetime.now()
  print("subidea_1_1:",subidea_1_1)
  print("subidea_1_1.__dict__:",subidea_1_1.__dict__)
  print("subidea_1_1.title:",subidea_1_1.title)
  print("subidea_1_1.title.entries_as_dict:",subidea_1_1.title.entries_as_dict)
  print("subidea_1_1.title.first_original():",subidea_1_1.title.first_original())
  print("subidea_1_1.title.first_original().__dict__:",subidea_1_1.title.first_original().__dict__)
  boba_fett = subidea_1_1.copy(tombstone=tombstone)
  print("boba_fett:",boba_fett)
  print("boba_fett.__dict__:",boba_fett.__dict__)
  print("boba_fett.title.first_original():",boba_fett.title.first_original())
  print("boba_fett.title.first_original().__dict__:",boba_fett.title.first_original().__dict__)
  assert len(subidea_1_1.title.entries) == len(boba_fett.title.entries)
  assert subidea_1_1.title.first_original().value == boba_fett.title.first_original().value

  test_session.add(boba_fett)
  test_session.commit()

  print("boba_fett:",boba_fett)
  print("boba_fett.__dict__:",boba_fett.__dict__)
  print("boba_fett.title:",boba_fett.title)
  print("boba_fett.title.__dict__:",boba_fett.title.__dict__)
  print("boba_fett.title.entries_as_dict:",boba_fett.title.entries_as_dict)
  print("boba_fett.title.first_original():",boba_fett.title.first_original())
  print("boba_fett.title.first_original().__dict__:",boba_fett.title.first_original().__dict__)

  assert len(subidea_1_1.title.entries) == len(boba_fett.title.entries)
  assert subidea_1_1.title.first_original().value == boba_fett.title.first_original().value

  # remove the cloned langstring after use
  for entry in boba_fett.entries:
    test_session.delete(entry)
  test_session.delete(boba_fett)
  test_session.commit()

