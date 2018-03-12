import { Map } from 'immutable';

export const tokenCategories = [
  {
    color: '#226622',
    id: 'positive',
    title: 'Positive',
    totalNumber: 12
  },
  {
    color: '#771122',
    id: 'negative',
    title: 'Negative',
    totalNumber: 10
  }
];

export const tokenVoteModule = {
  exclusiveCategories: true,
  id: 'token-vote-module',
  instructions: 'If we generate the feed, we can get to the AGP driver through the primary ADP interface!',
  tokenCategories: tokenCategories,
  voteType: 'token_vote_specification'
};

export const textGaugeModule = {
  id: 'text-gauge-module',
  instructions: 'I\'ll generate the mobile SMS bus, that should microchip the TCP matrix!',
  voteType: 'gauge_vote_specification'
};

export const proposals = [
  {
    id: 'proposal-1',
    title: 'First proposal',
    description: 'You can\'t hack the alarm without connecting the primary AGP microchip!',
    modules: [tokenVoteModule],
    voteResults: {
      numParticipants: 1
    }
  },
  {
    id: 'proposal-2',
    title: 'Second proposal',
    description: 'I\'ll input the multi-byte SAS monitor, that should bandwidth the USB microchip!',
    modules: [tokenVoteModule, textGaugeModule],
    voteResults: {
      numParticipants: 2
    }
  }
];

export const remainingTokensByCategory = Map({
  negative: 4,
  positive: 10
});

export const proposal1Votes = Map({
  positive: 2,
  negative: 0
});

export const userTokenVotes = Map({
  'proposal-1': proposal1Votes,
  'proposal-2': Map({
    positive: 0,
    negative: 6
  })
});