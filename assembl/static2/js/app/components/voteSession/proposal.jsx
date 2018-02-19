// @flow
import React from 'react';
import { Col, Row } from 'react-bootstrap';
import { Map } from 'immutable';

import TokenVoteForProposal from './tokenVoteForProposal';
import { GaugeVoteForProposal, NumberGaugeVoteForProposal } from './gaugeVoteForProposal';
import {
  findTokenVoteModule,
  type RemainingTokensByCategory,
  type UserTokenVotes,
  type VoteSpecification
} from '../../pages/voteSession';

type Props = {
  description: ?string,
  id: string,
  modules: ?Array<VoteSpecification>,
  remainingTokensByCategory: RemainingTokensByCategory,
  title: ?string,
  tokenVotes: UserTokenVotes,
  voteForProposal: Function,
  voteForProposalGauge: Function
};

const Proposal = ({
  description,
  id,
  modules,
  remainingTokensByCategory,
  title,
  tokenVotes,
  voteForProposal,
  voteForProposalGauge
}: Props) => {
  const tokenVoteModule = modules ? findTokenVoteModule(modules) : null;
  return (
    <div className="theme-box">
      <Row className="proposal">
        <Col xs={12} md={5}>
          <h3 className="proposal-title dark-title-3">{title}</h3>
          <p className="text">{description}</p>
        </Col>
        <Col xs={12} md={7} className="proposal-vote-modules">
          {tokenVoteModule && (
            <TokenVoteForProposal
              key={tokenVoteModule.id}
              instructions={tokenVoteModule.instructions}
              proposalId={id}
              remainingTokensByCategory={remainingTokensByCategory}
              tokenCategories={tokenVoteModule.tokenCategories}
              tokenVotes={tokenVotes.get(id, Map())}
              voteForProposal={voteForProposal}
            />
          )}

          {modules &&
            modules.filter(module => module.voteType === 'gauge_vote_specification').map(module => (
              <GaugeVoteForProposal
                key={module.id}
                {...module}
                voteForProposal={voteForProposalGauge}
                proposalId={id}
                value={0} // TODO: use myVotes
              />
            ))}

          {modules &&
            modules
              .filter(module => module.voteType === 'number_gauge_vote_specification')
              // $FlowFixMe
              .map(module => <NumberGaugeVoteForProposal key={module.id} {...module} />)}
        </Col>
      </Row>
    </div>
  );
};

export default Proposal;