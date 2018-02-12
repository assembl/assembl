// @flow
import React from 'react';
import { Col, Row } from 'react-bootstrap';
import { Map } from 'immutable';

import TokenVoteForProposal from './tokenVoteForProposal';
import GaugeVoteForProposal from './gaugeVoteForProposal';
import { type UserTokenVotes } from '../../pages/voteSession';

type Props = {
  description: string,
  id: string,
  modules: Array<Object>,
  title: string,
  tokenVotes: UserTokenVotes,
  voteForProposal: Function
};

const Proposal = ({ description, id, modules, title, tokenVotes, voteForProposal }: Props) => (
  <div className="theme-box">
    <Row className="proposal">
      <Col xs={6} md={6}>
        <h3 className="dark-title-3">{title}</h3>
        <p>{description}</p>
      </Col>
      <Col xs={6} md={6}>
        {modules
          .filter(module => module.voteType === 'token_vote_specification')
          .map(module => (
            <TokenVoteForProposal
              key={module.id}
              {...module}
              proposalId={id}
              tokenVotes={tokenVotes.get(id, Map())}
              voteForProposal={voteForProposal}
            />
          ))}
        {modules
          .filter(module => module.voteType === 'gauge_vote_specification')
          .map(module => <GaugeVoteForProposal key={module.id} {...module} />)}
      </Col>
    </Row>
  </div>
);

export default Proposal;