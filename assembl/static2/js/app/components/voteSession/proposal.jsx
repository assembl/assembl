// @flow
import React from 'react';

import TokenVoteForProposal from './tokenVoteForProposal';
import GaugeVoteForProposal from './gaugeVoteForProposal';

type Props = {
  description: string,
  modules: Array<Object>,
  title: string
};

const Proposal = ({ description, modules, title }: Props) => (
  <div className="box">
    <div className="left">
      <h3 className="dark-title-3">{title}</h3>
      <p>{description}</p>
    </div>
    <div className="right">
      {/* tokens and gauge */}
      {modules
        .filter(module => module.voteType === 'token_vote_specification')
        .map(module => <TokenVoteForProposal key={module.id} {...module} />)}
      {modules
        .filter(module => module.voteType === 'gauge_vote_specification')
        .map(module => <GaugeVoteForProposal key={module.id} {...module} />)}
    </div>
    <div className="clear" />
  </div>
);

export default Proposal;