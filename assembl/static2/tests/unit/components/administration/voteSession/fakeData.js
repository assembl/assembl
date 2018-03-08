import { Map, List } from 'immutable';

const VOTE_PROPOSITION_1 = Map({
  _isNew: false,
  _toDelete: false,
  id: '1234',
  titleEntries: List(),
  descriptionEntries: List()
});

const VOTE_PROPOSITION_2 = Map({
  _isNew: false,
  _toDelete: false,
  id: '5678',
  titleEntries: List(),
  descriptionEntries: List()
});

const TEXT_CHOICE_1 = Map({
  id: '2233',
  labelEntries: List(),
  value: 1
});

const TEXT_CHOICE_2 = Map({
  id: '3344',
  labelEntries: List(),
  value: 2
});

export const voteProposalsInOrder = List.of(VOTE_PROPOSITION_1, VOTE_PROPOSITION_2);
export const textChoices = List.of(TEXT_CHOICE_1, TEXT_CHOICE_2);