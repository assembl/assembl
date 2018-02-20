// @flow
import React from 'react';

import ParticipantsCount from './participantsCount';
import TokenVotesResults from './tokenVotesResults';
import { type TokenCategories } from './tokenVoteForProposal';

type Props = {
  participantsCount: number,
  tokenCategories: TokenCategories,
  tokenVotes: { [string]: number }
};

const VotesInProgress = ({ participantsCount, tokenCategories, tokenVotes }: Props) => (
  <div className="votes-in-progress">
    <ParticipantsCount count={participantsCount} />
    {tokenCategories && <TokenVotesResults categories={tokenCategories} votes={tokenVotes} />}
  </div>
);

const mockData = {
  participantsCount: 125,
  tokenVotes: {
    category1: 112,
    category2: 44
  }
};

// $FlowFixMe
const withMockData = data => Component => props => <Component {...data} {...props} />;

export default withMockData(mockData)(VotesInProgress);