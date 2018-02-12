// @flow
import React from 'react';
import { Grid } from 'react-bootstrap';

import Proposal from './proposal';
import { type UserTokenVotes } from '../../pages/voteSession';

type Props = {
  modules: Array<Object>,
  proposals: Array<Object>,
  tokenVotes: UserTokenVotes,
  voteForProposal: Function
};

const Proposals = (props: Props) => (
  <Grid>
    {props.proposals.map(proposal => (
      <Proposal
        key={proposal.id}
        {...proposal}
        modules={props.modules}
        tokenVotes={props.tokenVotes}
        voteForProposal={props.voteForProposal}
      />
    ))}
  </Grid>
);

export default Proposals;