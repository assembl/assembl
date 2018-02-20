// @flow
import React from 'react';
import { Button, OverlayTrigger } from 'react-bootstrap';

import Circle from '../svg/circle';
import { resetTokensTooltip } from '../common/tooltips';
import { type RemainingTokensByCategory, type TokenVotesForProposal } from '../../pages/voteSession';

export type TokenCategory = {|
  id: string,
  totalNumber: number,
  typename: string,
  title: ?string,
  titleEntries: ?Array<?LangStringEntryInput>,
  color: ?string
|};

export type TokenCategories = ?Array<?TokenCategory>;

type Props = {
  instructions: ?string,
  proposalId: string,
  remainingTokensByCategory: RemainingTokensByCategory,
  tokenCategories: TokenCategories,
  tokenVotes: TokenVotesForProposal,
  voteForProposal: Function
};

const TokenVoteForProposal = ({
  instructions,
  proposalId,
  remainingTokensByCategory,
  tokenCategories,
  tokenVotes,
  voteForProposal
}: Props) => (
  <div>
    <p>{instructions}</p>
    {tokenCategories &&
      tokenCategories.map((category) => {
        if (category) {
          const { color, id, title, totalNumber } = category;
          const currentVote = tokenVotes.get(category.id, 0);
          return (
            <div key={id} className="tokens-line">
              <p>{title}</p>
              <div className="tokens">
                {[...Array(totalNumber).keys()].map(n => (
                  <Button
                    key={n + 1}
                    className="admin-icons"
                    disabled={n + 1 > currentVote + remainingTokensByCategory.get(id)}
                    onClick={() => voteForProposal(proposalId, id, n + 1)}
                  >
                    <Circle size="32px" strokeColor={color} fillColor={n + 1 <= currentVote ? color : undefined} />
                  </Button>
                ))}
                <OverlayTrigger placement="top" overlay={resetTokensTooltip}>
                  <Button onClick={() => voteForProposal(proposalId, id, 0)}>
                    <span className="assembl-icon-delete grey" />
                  </Button>
                </OverlayTrigger>
              </div>
            </div>
          );
        }

        return null;
      })}
  </div>
);

export default TokenVoteForProposal;