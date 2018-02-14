// @flow
import React from 'react';
import { Col, Row } from 'react-bootstrap';
import { Map } from 'immutable';

import TokenVoteForProposal from './tokenVoteForProposal';
import GaugeVoteForProposal from './gaugeVoteForProposal';
import NumberGaugeVoteForProposal from './numberGaugeVoteForProposal';
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
  voteForProposal: Function
};

const Proposal = ({ description, id, modules, remainingTokensByCategory, title, tokenVotes, voteForProposal }: Props) => {
  const tokenVoteModule = modules ? findTokenVoteModule(modules) : null;
  return (
    <div className="theme-box">
      <Row className="proposal">
        <Col xs={12} md={5}>
          <h3 className="dark-title-3">{title}</h3>
          <p>{description}</p>
        </Col>
        <Col xs={12} md={7}>
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
            modules
              .filter(module => module.voteType === 'gauge_vote_specification')
              // $FlowFixMe
              .map(module => <GaugeVoteForProposal key={module.id} {...module} />)}

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