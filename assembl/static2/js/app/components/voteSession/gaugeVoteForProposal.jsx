// @flow
import React from 'react';

type Props = {
  instructions: string
};

const GaugeVoteForProposal = ({ instructions }: Props) => <div className="gauge">{instructions}</div>;

export default GaugeVoteForProposal;