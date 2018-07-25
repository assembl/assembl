// @flow
import * as React from 'react';

import ProposalResults from './proposalResults';
import { type Proposal as ProposalType } from '../../pages/voteSession';

type Props = {
  proposals: Array<ProposalType>
};

const ProposalsResults = (props: Props) => (
  <div>
    {props.proposals.map(proposal => (
      <ProposalResults
        key={proposal.id}
        id={proposal.id}
        title={proposal.title}
        description={proposal.description}
        modules={proposal.modules}
        numParticipants={proposal.voteResults.numParticipants}
      />
    ))}
  </div>
);

export default ProposalsResults;