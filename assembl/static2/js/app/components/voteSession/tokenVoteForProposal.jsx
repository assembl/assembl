// @flow
import React from 'react';
import { Button, OverlayTrigger } from 'react-bootstrap';

import Circle from '../svg/circle';
import { hiddenTooltip, exclusiveTokensTooltip, notEnoughTokensTooltip, resetTokensTooltip } from '../common/tooltips';
import { type RemainingTokensByCategory, type UserTokenVotesForProposal } from '../../pages/voteSession';

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
  exclusiveCategories: ?boolean,
  instructions: ?string,
  proposalId: string,
  remainingTokensByCategory: RemainingTokensByCategory,
  tokenCategories: TokenCategories,
  userTokenVotesForProposal: UserTokenVotesForProposal,
  voteForProposal: Function
};

const TokenVoteForProposal = ({
  exclusiveCategories,
  instructions,
  proposalId,
  remainingTokensByCategory,
  tokenCategories,
  userTokenVotesForProposal,
  voteForProposal
}: Props) => (
  <div className="margin-m">
    <p>{instructions}</p>
    {tokenCategories &&
      tokenCategories.map((category) => {
        if (category) {
          const { color, id, title, totalNumber } = category;
          const currentVote = userTokenVotesForProposal.get(category.id, 0);
          let cantVote = false;
          if (exclusiveCategories) {
            cantVote = userTokenVotesForProposal.delete(category.id).some(count => count > 0);
          }

          return (
            <div key={id} className="tokens-line">
              <p>{title}</p>
              <div className="tokens">
                {[...Array(totalNumber).keys()].map((n) => {
                  const notEnoughTokens = n + 1 > currentVote + remainingTokensByCategory.get(id);
                  const disabled = cantVote || notEnoughTokens;
                  let disabledTooltip = hiddenTooltip;
                  if (disabled) {
                    disabledTooltip = notEnoughTokens ? notEnoughTokensTooltip : exclusiveTokensTooltip;
                  }
                  return (
                    <OverlayTrigger key={n + 1} placement="top" overlay={disabledTooltip}>
                      <Button className="admin-icons" disabled={disabled} onClick={() => voteForProposal(proposalId, id, n + 1)}>
                        <Circle size="32px" strokeColor={color} fillColor={n + 1 <= currentVote ? color : undefined} />
                      </Button>
                    </OverlayTrigger>
                  );
                })}
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