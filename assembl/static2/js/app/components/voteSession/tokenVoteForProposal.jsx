// @flow
import React from 'react';

import Circle from '../svg/circle';

type Props = {
  instructions: string,
  tokenCategories: Array<Object>
};

const TokenVoteForProposal = ({ instructions, tokenCategories }: Props) => (
  <div>
    {instructions}
    {tokenCategories.map(category => (
      <div key={category.id}>
        <p>{category.title}</p>
        {[...Array(category.totalNumber).keys()].map(i => <Circle key={i} />)}
      </div>
    ))}
  </div>
);

export default TokenVoteForProposal;