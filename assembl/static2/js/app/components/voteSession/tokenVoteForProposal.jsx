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
        <div className="tokens">
          {[...Array(category.totalNumber).keys()].map(n => <Circle key={n} size="35px" strokeColor={category.color} />)}
        </div>
      </div>
    ))}
  </div>
);

export default TokenVoteForProposal;