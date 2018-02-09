// @flow
import React from 'react';

import Proposal from './proposal';

type Props = {
  modules: Array<Object>,
  proposals: Array<Object>
};

const Proposals = (props: Props) => (
  <div>{props.proposals.map(proposal => <Proposal key={proposal.id} {...proposal} modules={props.modules} />)}</div>
);

export default Proposals;