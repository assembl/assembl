// @flow
import React from 'react';

type Props = {
  proposals: Array<Object>
};

const Proposal = ({ description, title }) => (
  <div className="box">
    <div className="left">
      <h3 className="dark-title-3">{title}</h3>
      <p>{description}</p>
    </div>
    <div className="right">{/* tokens and gauge */}</div>
    <div className="clear" />
  </div>
);

const Proposals = (props: Props) => <div>{props.proposals.map(proposal => <Proposal key={proposal.id} {...proposal} />)}</div>;

export default Proposals;