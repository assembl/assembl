// @flow
import React from 'react';

import ParticipantsCount from './participantsCount';

type Props = {
  participantsCount: number
};

const VotesInProgress = ({ participantsCount }: Props) => (
  <div className="votes-in-progress">
    <ParticipantsCount count={participantsCount} />
  </div>
);

const mockData = {
  participantsCount: 125
};

const withMockData = data => Component => () => <Component {...data} />;

export default withMockData(mockData)(VotesInProgress);