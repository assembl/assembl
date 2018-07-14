// @flow
import * as React from 'react';

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
  seeCurrentVotes: boolean,
  userGaugeVotes: UserGaugeVotes,
  userTokenVotes: UserTokenVotes,
  voteForProposalToken: Function,
  voteForProposalGauge: Function,
  onVoteChange: Function
};

const Proposals = (props: Props) => (
  <div>
    {props.proposals.map(proposal => (
      <Proposal
        key={proposal.id}
        {...proposal}
        modules={proposal.modules}
        numParticipants={proposal.voteResults.numParticipants}
        remainingTokensByCategory={props.remainingTokensByCategory}
        seeCurrentVotes={props.seeCurrentVotes}
        userTokenVotes={props.userTokenVotes}
        userGaugeVotes={props.userGaugeVotes}
        voteForProposalToken={props.voteForProposalToken}
        voteForProposalGauge={props.voteForProposalGauge}
        onVoteChange={props.onVoteChange}
      />
    ))}
  </div>
);

export default Proposals;