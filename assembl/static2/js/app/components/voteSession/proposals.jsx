// @flow
import React from 'react';
import { Grid } from 'react-bootstrap';

import Proposal from './proposal';
import {
  type Proposal as ProposalType,
  type RemainingTokensByCategory,
  type UserTokenVotes,
  type UserGaugeVotes
} from '../../pages/voteSession';

type Props = {
  proposals: Array<ProposalType>,
  remainingTokensByCategory: RemainingTokensByCategory,
  userGaugeVotes: UserGaugeVotes,
  userTokenVotes: UserTokenVotes,
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
        numParticipants={proposal.voteResults.numParticipants}
        remainingTokensByCategory={props.remainingTokensByCategory}
        userTokenVotes={props.userTokenVotes}
        userGaugeVotes={props.userGaugeVotes}
        voteForProposal={props.voteForProposal}
        voteForProposalGauge={props.voteForProposalGauge}
      />
    ))}
  </Grid>
);

export default Proposals;