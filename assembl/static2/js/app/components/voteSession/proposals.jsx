// @flow
import React from 'react';
import { Grid } from 'react-bootstrap';

import Proposal from './proposal';
import { type Proposal as ProposalType, type RemainingTokensByCategory, type UserTokenVotes } from '../../pages/voteSession';

type Props = {
  proposals: Array<ProposalType>,
  remainingTokensByCategory: RemainingTokensByCategory,
  tokenVotes: UserTokenVotes,
  voteForProposal: Function,
  voteForProposalGauge: Function
};

const Proposals = (props: Props) => (
  <Grid>
    {props.proposals.map(proposal => (
      <Proposal
        key={proposal.id}
        {...proposal}
        modules={proposal.modules}
        remainingTokensByCategory={props.remainingTokensByCategory}
        tokenVotes={props.tokenVotes}
        voteForProposal={props.voteForProposal}
        voteForProposalGauge={props.voteForProposalGauge}
      />
    ))}
  </Grid>
);

export default Proposals;