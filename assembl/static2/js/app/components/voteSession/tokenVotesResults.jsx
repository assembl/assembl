// @flow
import fromPairs from 'lodash/fromPairs';
import React from 'react';
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
  numVotes: number
};

type CreateTooltip = (TokenCategory, number) => React.Element<*>;
export const createTooltip: CreateTooltip = (category, count) => (
  <Tooltip
    id={`${category.typename}-token-tooltip`}
    className="no-arrow-tooltip token-tooltip"
    style={{ backgroundColor: category.color }}
  >
    <Translate value="debate.voteSession.tokenTooltip" count={count} name={category.title} />
  </Tooltip>
);

const TokenVotesResults = ({ categories, tokenVotes, numVotes }: Props) => {
  const votes = fromPairs(tokenVotes);
  const elements = categories
    .map((category) => {
      // TODO: use the category.id here instead of typename
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
    <div className="box center tokens-box">
      <Translate value="debate.voteSession.votesTotal" count={numVotes} />
      <div className="doughnut-container">
        <Doughnut elements={elements} />
      </div>
      <div className="doughnut-totalCount">
        <div className="vote-totalCount">{numVotes}</div>
        <div>{numVotes > 1 ? <Translate value="debate.voteSession.votes" /> : <Translate value="debate.voteSession.vote" />}</div>
      </div>
    </div>
  );
};

export default TokenVotesResults;