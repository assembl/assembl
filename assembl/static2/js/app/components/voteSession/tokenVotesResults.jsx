// @flow
import React from 'react';
import { Tooltip } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';

import { type TokenCategory } from './tokenVoteForProposal';
import Doughnut from '../svg/doughnut';

type Props = {
  categories: Array<?TokenCategory>,
  votes: { [string]: number }
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

const TokenVotesResults = ({ categories, votes }: Props) => {
  // this is a bit ugly but we need to do this to make flow happy as it does not understands Object.values well
  // (see this discussion/this comment  https://github.com/facebook/flow/issues/2221#issuecomment-366519862 )
  const total = Object.keys(votes)
    .map(k => votes[k])
    .reduce((pv, cv) => pv + cv, 0);
  const elements = categories
    .map((category) => {
      // TODO: use the category.id here instead of typename
      if (category) {
        return {
          color: category.color,
          count: votes[category.typename],
          Tooltip: createTooltip(category, votes[category.typename])
        };
      }

      return null;
    })
    .filter(e => e); // remove null items
  return (
    <div className="box center tokens-box">
      <Translate value="debate.voteSession.votesTotal" count={total} />
      <div className="doughnut-container">
        <Doughnut elements={elements} />
      </div>
    </div>
  );
};

export default TokenVotesResults;