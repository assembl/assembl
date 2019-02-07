// @flow
import * as React from 'react';
import { Tooltip } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';

import { type TokenCategory } from './tokenVoteForProposal';
import Doughnut from '../svg/doughnut';

type Props = {
  categories: Array<?TokenCategory>,
  tokenVotes: Array<?{|
    tokenCategoryId: string,
    numToken: number
  |}>,
  numVotes: number,
  titleMsgId: string
};

type CreateTooltip = (TokenCategory, number) => React.Element<any>;
export const createTooltip: CreateTooltip = (category, count) => (
  <Tooltip
    id={`${category.typename}-token-tooltip`}
    className="no-arrow-tooltip token-tooltip"
    style={{ backgroundColor: category.color, marginTop: 7 }}
  >
    <Translate value="debate.voteSession.tokenTooltip" count={count} name={category.title} />
  </Tooltip>
);

const TokenVotesResults = ({ categories, tokenVotes, numVotes, titleMsgId }: Props) => {
  const votes = {};
  tokenVotes.forEach((vote) => {
    if (vote) {
      votes[vote.tokenCategoryId] = vote.numToken;
    }
  });
  const elements = categories
    .map((category) => {
      if (category) {
        return {
          color: category.color,
          count: votes[category.id],
          Tooltip: createTooltip(category, votes[category.id])
        };
      }

      return null;
    })
    .filter(e => e); // remove null items
  return (
    <div className="box tokens-box">
      <Translate value={titleMsgId} count={numVotes} />
      <div className="doughnut-container">
        <Doughnut elements={elements} />
        <div className="doughnut-totalCount">
          <div className="vote-totalCount">{numVotes}</div>
          <div>{numVotes > 1 ? <Translate value="debate.votes" /> : <Translate value="debate.vote" />}</div>
        </div>
      </div>
    </div>
  );
};

export default TokenVotesResults;