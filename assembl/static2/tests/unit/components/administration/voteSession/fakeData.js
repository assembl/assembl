import { Map, List } from 'immutable';

const VOTE_PROPOSITION_1 = Map({
  isNew: false,
  toDelete: false,
  id: '1234',
  titleEntries: List(),
  descriptionEntries: List()
});

const VOTE_PROPOSITION_2 = Map({
  isNew: false,
  toDelete: false,
  id: '5678',
  titleEntries: List(),
  descriptionEntries: List()
});

export const voteProposalsInOrder = List.of(VOTE_PROPOSITION_1, VOTE_PROPOSITION_2);