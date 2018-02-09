// @flow
import React from 'react';
import { Col, Row } from 'react-bootstrap';

import TokenVoteForProposal from './tokenVoteForProposal';
import GaugeVoteForProposal from './gaugeVoteForProposal';

type Props = {
  description: string,
  modules: Array<Object>,
  title: string
};

const Proposal = ({ description, modules, title }: Props) => (
  <div className="theme-box">
    <Row className="proposal">
      <Col xs={6} md={6}>
        <h3 className="dark-title-3">{title}</h3>
        <p>{description}</p>
      </Col>
      <Col xs={6} md={6}>
        {/* tokens and gauge */}
        {modules
          .filter(module => module.voteType === 'token_vote_specification')
          .map(module => <TokenVoteForProposal key={module.id} {...module} />)}
        {modules
          .filter(module => module.voteType === 'gauge_vote_specification')
          .map(module => <GaugeVoteForProposal key={module.id} {...module} />)}
      </Col>
    </Row>
  </div>
);

export default Proposal;