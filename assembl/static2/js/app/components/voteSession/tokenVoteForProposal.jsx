// @flow
import React from 'react';
import { Button } from 'react-bootstrap';

import Circle from '../svg/circle';
import { type TokenVotesForProposal } from '../../pages/voteSession';

type Props = {
  instructions: string,
  proposalId: string,
  tokenCategories: Array<Object>,
  tokenVotes: TokenVotesForProposal,
  voteForProposal: Function
};

const TokenVoteForProposal = ({ instructions, proposalId, tokenCategories, tokenVotes, voteForProposal }: Props) => (
  <div>
    {instructions}
    {tokenCategories.map((category) => {
      const currentVote = tokenVotes.get(category.id, 0);
      return (
        <div key={category.id}>
          <p>{category.title}</p>
          <div className="tokens">
            {[...Array(category.totalNumber).keys()].map(n => (
              <Button key={n + 1} className="admin-icons" onClick={() => voteForProposal(proposalId, category.id, n + 1)}>
                <Circle size="35px" strokeColor={category.color} fillColor={n + 1 <= currentVote ? category.color : undefined} />
              </Button>
            ))}
          </div>
        </div>
      );
    })}
  </div>
);

export default TokenVoteForProposal;