// @flow
import React from 'react';
import { Grid } from 'react-bootstrap';

import Proposal from './proposal';

type Props = {
  modules: Array<Object>,
  proposals: Array<Object>
};

const Proposals = (props: Props) => (
  <Grid>{props.proposals.map(proposal => <Proposal key={proposal.id} {...proposal} modules={props.modules} />)}</Grid>
);

export default Proposals;